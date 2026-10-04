"use server";

import { db } from "@/lib/db";
import { fail, formObject, zodFail, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { messageSchema, threadSchema, ticketSchema } from "@/lib/validation";
import { filesFrom, saveFiles, validateFiles, UploadError } from "@/lib/uploads";
import { refNumber } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";

async function attach(userId: string, fd: FormData, purpose: "MESSAGE" | "TICKET", link: { messageId?: string; ticketReplyId?: string }) {
  const files = filesFrom(fd);
  if (!files.length) return null;
  try {
    await saveFiles(userId, files, purpose, link);
    return null;
  } catch (e) {
    return e instanceof UploadError ? e.message : "errors.generic";
  }
}

/* ---------- Threads (customer side) ---------- */

export async function createThreadAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("thread", 10, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  const parsed = threadSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const fileErr = validateFiles(filesFrom(fd), 5);
  if (fileErr) return fail(fileErr);

  // "website:<id>" | "order:<id>" | "request:<id>" — verify ownership of the linked record.
  const link: { websiteId?: string; orderId?: string; requestId?: string } = {};
  if (parsed.data.related) {
    const [kind, id] = parsed.data.related.split(":");
    if (kind === "website" && (await db.website.findFirst({ where: { id, userId: user.id } }))) link.websiteId = id;
    if (kind === "order" && (await db.order.findFirst({ where: { id, userId: user.id } }))) link.orderId = id;
    if (kind === "request" && (await db.modificationRequest.findFirst({ where: { id, userId: user.id } }))) link.requestId = id;
  }
  const thread = await db.thread.create({
    data: {
      userId: user.id,
      subject: parsed.data.subject,
      ...link,
      unreadByAdmin: 1,
      messages: { create: { senderId: user.id, body: parsed.data.body } },
    },
    include: { messages: true },
  });
  await attach(user.id, fd, "MESSAGE", { messageId: thread.messages[0].id });
  return { ok: true, message: "success.sent", redirect: `/dashboard/messages/${thread.id}` };
}

export async function sendMessageAction(threadId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("message", 30, 60_000, user.id))) return fail("errors.rateLimited");
  const isAdmin = user.role === "ADMIN";
  const thread = await db.thread.findFirst({ where: isAdmin ? { id: threadId } : { id: threadId, userId: user.id } });
  if (!thread) return fail("errors.notFound");
  const parsed = messageSchema.safeParse(formObject(fd));
  const files = filesFrom(fd);
  if (!parsed.success && !files.length) return zodFail(parsed.error!);
  const fileErr = validateFiles(files, 5);
  if (fileErr) return fail(fileErr);

  const fromStaff = isAdmin && thread.userId !== user.id;
  const msg = await db.message.create({ data: { threadId, senderId: user.id, body: parsed.success ? parsed.data.body : "📎", fromStaff } });
  await db.thread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date(), ...(fromStaff ? { unreadByUser: { increment: 1 } } : { unreadByAdmin: { increment: 1 } }) },
  });
  const err = await attach(user.id, fd, "MESSAGE", { messageId: msg.id });
  if (fromStaff) await notify(thread.userId, "newMessage", {}, { link: `/dashboard/messages/${threadId}`, channel: "messages" });
  if (err) return fail(err);
  return { ok: true };
}

/* ---------- Support tickets ---------- */

export async function createTicketAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("ticket", 5, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  const parsed = ticketSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const fileErr = validateFiles(filesFrom(fd), 5);
  if (fileErr) return fail(fileErr);
  const ticket = await db.supportTicket.create({
    data: {
      number: refNumber("TK"),
      userId: user.id,
      subject: parsed.data.subject,
      category: parsed.data.category,
      status: "AWAITING_STAFF",
      replies: { create: { authorId: user.id, body: parsed.data.body } },
    },
    include: { replies: true },
  });
  await attach(user.id, fd, "TICKET", { ticketReplyId: ticket.replies[0].id });
  return { ok: true, message: "success.ticketCreated", redirect: `/dashboard/support/${ticket.id}` };
}

export async function replyTicketAction(ticketId: string, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("ticket-reply", 20, 60_000, user.id))) return fail("errors.rateLimited");
  const isAdmin = user.role === "ADMIN";
  const ticket = await db.supportTicket.findFirst({ where: isAdmin ? { id: ticketId } : { id: ticketId, userId: user.id } });
  if (!ticket) return fail("errors.notFound");
  const parsed = messageSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const fileErr = validateFiles(filesFrom(fd), 5);
  if (fileErr) return fail(fileErr);
  const fromStaff = isAdmin && ticket.userId !== user.id;
  const reply = await db.ticketReply.create({ data: { ticketId, authorId: user.id, body: parsed.data.body, fromStaff } });
  await db.supportTicket.update({ where: { id: ticketId }, data: { status: fromStaff ? "ANSWERED" : "AWAITING_STAFF" } });
  await attach(user.id, fd, "TICKET", { ticketReplyId: reply.id });
  if (fromStaff) await notify(ticket.userId, "ticketReply", { number: ticket.number }, { link: `/dashboard/support/${ticketId}`, channel: "messages" });
  return { ok: true, message: "success.sent" };
}

export async function closeTicketAction(ticketId: string): Promise<ActionResult> {
  const user = await requireUser();
  const where = user.role === "ADMIN" ? { id: ticketId } : { id: ticketId, userId: user.id };
  const { count } = await db.supportTicket.updateMany({ where, data: { status: "CLOSED" } });
  return count ? { ok: true, message: "success.statusUpdated" } : fail("errors.notFound");
}
