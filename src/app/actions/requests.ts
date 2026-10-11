"use server";

import { db } from "@/lib/db";
import { fail, formObject, zodFail, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { modRequestSchema } from "@/lib/validation";
import { quoteModification } from "@/lib/pricing";
import { createPayment, startCheckout } from "@/lib/payments";
import { filesFrom, saveFiles, validateFiles, UploadError } from "@/lib/uploads";
import { notify, logActivity } from "@/lib/notify";
import { getCurrency } from "@/lib/prefs";
import { getSettings } from "@/lib/settings";
import { refNumber } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export async function createModRequestAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("mod-request", 10, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  const parsed = modRequestSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;

  if (v.websiteId) {
    const owns = await db.website.findFirst({ where: { id: v.websiteId, userId: user.id } });
    if (!owns) return fail("errors.forbidden");
  }
  const files = filesFrom(fd);
  const fileErr = validateFiles(files, 6);
  if (fileErr) return fail(fileErr, { files: fileErr });

  const quote = await quoteModification(user);
  let { finalGel, discountGel } = quote;
  let usedCredit = false;

  // Atomically consume a free Pro credit; if it races to zero, fall back to the Pro price.
  if (quote.usesCredit && user.membership) {
    const { count } = await db.proMembership.updateMany({
      where: { id: user.membership.id, freeModsUsed: { lt: user.membership.freeModsTotal } },
      data: { freeModsUsed: { increment: 1 } },
    });
    if (count === 1) usedCredit = true;
    else {
      finalGel = quote.proPriceGel;
      discountGel = quote.priceGel - quote.proPriceGel;
    }
  }

  const request = await db.modificationRequest.create({
    data: {
      number: refNumber("RQ"),
      userId: user.id,
      websiteId: v.websiteId,
      websiteUrl: v.websiteUrl,
      title: v.title,
      description: v.description,
      category: v.category,
      priority: v.priority,
      notes: v.notes,
      priceGel: quote.priceGel,
      discountGel,
      finalGel,
      usedFreeCredit: usedCredit,
      wasPro: quote.isPro,
      events: { create: { status: "SUBMITTED" } },
    },
  });

  try {
    if (files.length) await saveFiles(user.id, files, "REQUEST", { requestId: request.id });
  } catch (e) {
    // Files are optional — keep the request, but tell the user the upload failed.
    if (!(e instanceof UploadError)) throw e;
  }

  await logActivity(user.id, "requestCreated", { number: request.number }, v.websiteId);
  await notify(user.id, "requestStatus", { number: request.number, status: "@status.request.SUBMITTED" }, { link: `/dashboard/requests/${request.id}` });

  if (finalGel > 0) {
    const currency = await getCurrency();
    const rates = (await getSettings()).rates;
    const payment = await createPayment({
      userId: user.id,
      purpose: "MODIFICATION",
      requestId: request.id,
      amountGel: finalGel,
      method: "CARD",
      currency,
      rate: currency === "GEL" ? 1 : rates[currency],
      discountGel,
      items: [{ label: `modification:${request.number}`, amountGel: quote.priceGel }],
    });
    const url = await startCheckout(payment.id);
    if (!url) return fail("errors.paymentUnavailable");
    return { ok: true, message: "success.requestSubmitted", redirect: url };
  }
  return { ok: true, message: "success.requestSubmitted", redirect: `/dashboard/requests/${request.id}?new=1` };
}

export async function cancelRequestAction(requestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const r = await db.modificationRequest.findFirst({ where: { id: requestId, userId: user.id } });
  if (!r) return fail("errors.notFound");
  if (!["SUBMITTED", "REVIEWING", "APPROVED"].includes(r.status)) return fail("errors.forbidden");
  await db.$transaction([
    db.modificationRequest.update({ where: { id: r.id }, data: { status: "CANCELLED", events: { create: { status: "CANCELLED" } } } }),
    // Give the free credit back if one was used.
    ...(r.usedFreeCredit ? [db.proMembership.updateMany({ where: { userId: user.id, freeModsUsed: { gt: 0 } }, data: { freeModsUsed: { decrement: 1 } } })] : []),
    db.payment.updateMany({ where: { requestId: r.id, status: "PENDING" }, data: { status: "FAILED" } }),
  ]);
  await notify(user.id, "requestStatus", { number: r.number, status: "@status.request.CANCELLED" }, { link: `/dashboard/requests/${r.id}` });
  return { ok: true, message: "success.statusUpdated" };
}

export async function confirmRequestDoneAction(requestId: string): Promise<ActionResult> {
  const user = await requireUser();
  const r = await db.modificationRequest.findFirst({ where: { id: requestId, userId: user.id } });
  if (!r || r.status !== "WAITING_CUSTOMER") return fail("errors.forbidden");
  await db.modificationRequest.update({ where: { id: r.id }, data: { status: "COMPLETED", events: { create: { status: "COMPLETED", note: "customer-confirmed" } } } });
  await logActivity(user.id, "requestStatus", { number: r.number, status: "@status.request.COMPLETED" }, r.websiteId ?? undefined);
  return { ok: true, message: "success.statusUpdated" };
}
