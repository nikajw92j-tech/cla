"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { fail, formObject, zodFail, type ActionResult } from "@/lib/action";
import { requireAdmin } from "@/lib/auth/session";
import { notify, logActivity } from "@/lib/notify";
import { confirmPayment } from "@/lib/payments";
import { saveSetting, getSettings, type SiteSettings } from "@/lib/settings";
import { filesFrom, saveFiles, validateFiles, UploadError } from "@/lib/uploads";
import { FEATURES, LOCALES, ORDER_STATUSES, REQUEST_STATUSES, STAGES, TICKET_STATUSES, WEBSITE_STATUSES, isOneOf } from "@/lib/catalog";
import { baseDictionary } from "@/lib/i18n/server";
import { tk } from "@/lib/i18n/format";

const on = (fd: FormData, k: string) => fd.get(k) === "on";
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);

/* ---------- Requests ---------- */

export async function adminUpdateRequestAction(requestId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const status = String(fd.get("status"));
  const note = String(fd.get("note") ?? "").trim().slice(0, 1000) || null;
  if (!isOneOf(REQUEST_STATUSES, status)) return fail("errors.invalid");
  const r = await db.modificationRequest.findUnique({ where: { id: requestId } });
  if (!r) return fail("errors.notFound");
  if (r.status === status && !note) return { ok: true };
  await db.modificationRequest.update({ where: { id: r.id }, data: { status, events: { create: { status, note } } } });
  // Refund the free credit when an admin cancels a credit-funded request.
  if (status === "CANCELLED" && r.usedFreeCredit && r.status !== "CANCELLED") {
    await db.proMembership.updateMany({ where: { userId: r.userId, freeModsUsed: { gt: 0 } }, data: { freeModsUsed: { decrement: 1 } } });
  }
  const link = `/dashboard/requests/${r.id}`;
  if (status === "IN_PROGRESS") await notify(r.userId, "requestInProgress", {}, { link });
  else await notify(r.userId, "requestStatus", { number: r.number, status: `@status.request.${status}` }, { link });
  await logActivity(r.userId, "requestStatus", { number: r.number, status: `@status.request.${status}` }, r.websiteId ?? undefined);
  return { ok: true, message: "success.statusUpdated" };
}

/* ---------- Orders & websites ---------- */

export async function adminUpdateOrderStatusAction(orderId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const status = String(fd.get("status"));
  if (!isOneOf(ORDER_STATUSES, status) || status === "DRAFT") return fail("errors.invalid");
  const order = await db.order.update({ where: { id: orderId }, data: { status } }).catch(() => null);
  if (!order) return fail("errors.notFound");
  return { ok: true, message: "success.statusUpdated" };
}

const websiteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  stage: z.enum(STAGES.map((s) => s.code) as [string, ...string[]]),
  progress: z.coerce.number().int().min(0).max(100),
  status: z.enum(WEBSITE_STATUSES),
  url: z.string().trim().max(300).optional(),
  previewUrl: z.string().trim().max(300).optional(),
  eta: z.string().optional(),
});

export async function adminUpdateWebsiteAction(websiteId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = websiteSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;
  const site = await db.website.findUnique({ where: { id: websiteId } });
  if (!site) return fail("errors.notFound");
  const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : u ? `https://${u}` : null);
  await db.website.update({
    where: { id: websiteId },
    data: {
      name: v.name,
      stage: v.stage,
      progress: v.progress,
      status: v.stage === "COMPLETED" && v.status === "IN_DEVELOPMENT" ? "LIVE" : v.status,
      url: safeUrl(v.url),
      previewUrl: safeUrl(v.previewUrl),
      estimatedCompletion: v.eta ? new Date(v.eta) : null,
      managed: on(fd, "managed"),
    },
  });
  const link = `/dashboard/websites/${websiteId}`;
  if (v.stage !== site.stage) {
    await logActivity(site.userId, "stageChanged", { stage: `@status.stage.${v.stage}` }, websiteId);
    if (v.stage === "COMPLETED") {
      await notify(site.userId, "websiteCompleted", {}, { link });
      if (site.orderId) await db.order.update({ where: { id: site.orderId }, data: { status: "COMPLETED" } });
    } else {
      await notify(site.userId, "stageChanged", { name: site.name, stage: `@status.stage.${v.stage}` }, { link });
      if (site.orderId) await db.order.updateMany({ where: { id: site.orderId, status: "PAID" }, data: { status: "IN_PROGRESS" } });
    }
  }
  return { ok: true, message: "success.saved" };
}

export async function adminUploadPreviewAction(websiteId: string, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const site = await db.website.findUnique({ where: { id: websiteId } });
  if (!site) return fail("errors.notFound");
  const files = filesFrom(fd);
  const err = validateFiles(files, 10);
  if (err) return fail(err);
  if (!files.length) return fail("errors.required");
  try {
    await saveFiles(admin.id, files, "PREVIEW", { websiteId });
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "errors.generic");
  }
  await logActivity(site.userId, "previewUploaded", {}, websiteId);
  await notify(site.userId, site.stage === "DESIGN" ? "designReady" : "previewUploaded", { name: site.name }, { link: `/dashboard/websites/${websiteId}` });
  return { ok: true, message: "success.saved" };
}

/* ---------- Payments ---------- */

export async function adminMarkPaidAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();
  const ok = await confirmPayment(paymentId, `manual_${Date.now()}`);
  return ok ? { ok: true, message: "success.statusUpdated" } : fail("errors.notFound");
}

export async function adminRefundAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();
  const { count } = await db.payment.updateMany({ where: { id: paymentId, status: "SUCCEEDED" }, data: { status: "REFUNDED" } });
  if (count) await db.invoice.updateMany({ where: { paymentId }, data: { status: "VOID" } });
  return count ? { ok: true, message: "success.statusUpdated" } : fail("errors.notFound");
}

/* ---------- Customers & Pro ---------- */

export async function adminGrantProAction(userId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const days = Math.min(365, Math.max(1, num(fd, "days") || 30));
  const s = (await getSettings()).pro;
  const end = new Date(Date.now() + days * 86400000);
  await db.proMembership.upsert({
    where: { userId },
    create: { userId, priceGel: s.priceGel, freeModsTotal: s.freeMods, currentPeriodEnd: end },
    update: { status: "ACTIVE", currentPeriodEnd: end, cancelledAt: null, freeModsTotal: s.freeMods },
  });
  await notify(userId, "proActivated", {}, { link: "/dashboard/pro", channel: "billing" });
  return { ok: true, message: "success.saved" };
}

export async function adminRevokeProAction(userId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.proMembership.updateMany({ where: { userId }, data: { status: "EXPIRED", currentPeriodEnd: new Date() } });
  return { ok: true, message: "success.saved" };
}

export async function adminResetCreditsAction(userId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.proMembership.updateMany({ where: { userId }, data: { freeModsUsed: 0 } });
  return { ok: true, message: "success.saved" };
}

export async function adminSetRoleAction(userId: string, role: "ADMIN" | "CUSTOMER"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId) return fail("errors.forbidden");
  await db.user.update({ where: { id: userId }, data: { role, sessionVersion: { increment: 1 } } });
  return { ok: true, message: "success.saved" };
}

export async function adminStartThreadAction(userId: string, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const subject = String(fd.get("subject") ?? "").trim().slice(0, 140);
  const body = String(fd.get("body") ?? "").trim().slice(0, 5000);
  if (!subject || !body) return fail("errors.checkForm", { ...(subject ? {} : { subject: "errors.required" }), ...(body ? {} : { body: "errors.required" }) });
  const thread = await db.thread.create({
    data: { userId, subject, unreadByUser: 1, messages: { create: { senderId: admin.id, body, fromStaff: true } } },
  });
  await notify(userId, "newMessage", {}, { link: `/dashboard/messages/${thread.id}`, channel: "messages" });
  return { ok: true, message: "success.sent", redirect: `/admin/messages/${thread.id}` };
}

export async function adminTicketStatusAction(ticketId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const status = String(fd.get("status"));
  if (!isOneOf(TICKET_STATUSES, status)) return fail("errors.invalid");
  await db.supportTicket.update({ where: { id: ticketId }, data: { status } });
  return { ok: true, message: "success.statusUpdated" };
}

/* ---------- Packages, prices & settings ---------- */

export async function adminSavePackageAction(packageId: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const price = num(fd, "priceGel");
  const days = num(fd, "deliveryDays");
  if (!Number.isInteger(price) || price < 0 || price > 1_000_000) return fail("errors.invalid", { priceGel: "errors.invalid" });
  let content: unknown;
  try {
    content = JSON.parse(String(fd.get("content")));
  } catch {
    return fail("errors.invalid", { content: "errors.invalid" });
  }
  const contentSchema = z.record(z.enum(LOCALES), z.object({ name: z.string().min(1).max(80), tagline: z.string().max(200), features: z.array(z.string().max(200)).max(40) }));
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) return fail("errors.invalid", { content: "errors.invalid" });
  if (on(fd, "isPopular")) await db.package.updateMany({ where: { id: { not: packageId } }, data: { isPopular: false } });
  await db.package.update({
    where: { id: packageId },
    data: { priceGel: price, deliveryDays: Math.max(1, days || 14), isPopular: on(fd, "isPopular"), isActive: on(fd, "isActive"), content: JSON.stringify(parsed.data) },
  });
  return { ok: true, message: "success.saved" };
}

export async function adminSaveSettingsAction(section: keyof SiteSettings, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const current = await getSettings();
  const n = (k: string, min = 0, max = 1_000_000) => {
    const v = Number(fd.get(k));
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : NaN;
  };
  let value: SiteSettings[typeof section];
  switch (section) {
    case "stats":
      value = { websites: n("websites"), customers: n("customers"), projects: n("projects"), responseHours: n("responseHours", 0, 240) };
      break;
    case "rates":
      value = { USD: n("USD", 0.0001, 1000), RUB: n("RUB", 0.0001, 100000) };
      break;
    case "pro":
      value = { priceGel: n("priceGel"), freeMods: n("freeMods", 0, 100), modPriceGel: n("modPriceGel"), proModPriceGel: n("proModPriceGel"), orderDiscountPct: n("orderDiscountPct", 0, 90) };
      break;
    case "featurePrices":
      value = Object.fromEntries(FEATURES.map((f) => [f, n(f)])) as SiteSettings["featurePrices"];
      break;
    case "referral":
      value = { enabled: on(fd, "enabled"), rewardGel: n("rewardGel"), friendDiscountPct: n("friendDiscountPct", 0, 90) };
      break;
    case "contact": {
      const s = (k: string) => String(fd.get(k) ?? "").trim().slice(0, 200);
      value = { email: s("email"), phone: s("phone"), address: s("address"), instagram: s("instagram"), facebook: s("facebook"), linkedin: s("linkedin"), github: s("github") };
      break;
    }
    default:
      return fail("errors.invalid");
  }
  if (Object.values(value).some((v) => typeof v === "number" && Number.isNaN(v))) return fail("errors.checkForm");
  await saveSetting(section, { ...(current[section] as object), ...(value as object) } as SiteSettings[typeof section]);
  return { ok: true, message: "success.saved" };
}

/* ---------- Discounts ---------- */

const discountSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "errors.invalid"),
  description: z.string().max(200).optional(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1, "errors.invalid").max(100000),
  appliesTo: z.enum(["ALL", "ORDER", "MODIFICATION", "PRO"]),
  packageSlug: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  maxUses: z.string().optional(),
});

export async function adminCreateDiscountAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = discountSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;
  if (v.type === "PERCENT" && v.value > 100) return fail("errors.invalid", { value: "errors.invalid" });
  if (await db.discountCode.findUnique({ where: { code: v.code } })) return fail("errors.invalid", { code: "errors.invalid" });
  await db.discountCode.create({
    data: {
      code: v.code,
      description: v.description || null,
      type: v.type,
      value: v.value,
      appliesTo: v.appliesTo,
      packageSlug: v.packageSlug || null,
      proOnly: on(fd, "proOnly"),
      startsAt: v.startsAt ? new Date(v.startsAt) : null,
      endsAt: v.endsAt ? new Date(v.endsAt) : null,
      maxUses: v.maxUses ? Math.max(1, Number(v.maxUses)) : null,
    },
  });
  return { ok: true, message: "success.created" };
}

export async function adminToggleDiscountAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const c = await db.discountCode.findUnique({ where: { id } });
  if (!c) return fail("errors.notFound");
  await db.discountCode.update({ where: { id }, data: { active: !c.active } });
  return { ok: true, message: "success.saved" };
}

export async function adminDeleteDiscountAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.discountCode.delete({ where: { id } }).catch(() => null);
  return { ok: true, message: "success.deleted" };
}

/* ---------- Reviews ---------- */

export async function adminReviewAction(id: string, op: "approve" | "hide" | "feature" | "delete"): Promise<ActionResult> {
  await requireAdmin();
  if (op === "delete") await db.review.delete({ where: { id } }).catch(() => null);
  else if (op === "feature") {
    const r = await db.review.findUnique({ where: { id } });
    if (r) await db.review.update({ where: { id }, data: { featured: !r.featured, approved: true } });
  } else await db.review.update({ where: { id }, data: { approved: op === "approve" } });
  return { ok: true, message: op === "delete" ? "success.deleted" : "success.saved" };
}

/* ---------- Portfolio ---------- */

const portfolioSchema = z.object({
  title: z.string().trim().min(1, "errors.required").max(120),
  category: z.string().trim().min(1, "errors.required").max(60),
  description: z.string().trim().min(1, "errors.required").max(600),
  technologies: z.string().trim().max(200),
  desktopImage: z.string().trim().max(500).optional(),
  mobileImage: z.string().trim().max(500).optional(),
  liveUrl: z.string().trim().max(300).optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "errors.invalid"),
  sortOrder: z.coerce.number().int().min(0).max(999),
});
const httpsOrNull = (v?: string) => (v && /^https?:\/\//i.test(v) ? v : null);

export async function adminSavePortfolioAction(id: string | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = portfolioSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;
  const data = {
    ...v,
    desktopImage: httpsOrNull(v.desktopImage),
    mobileImage: httpsOrNull(v.mobileImage),
    liveUrl: httpsOrNull(v.liveUrl),
    published: on(fd, "published"),
  };
  if (id) await db.portfolioProject.update({ where: { id }, data });
  else await db.portfolioProject.create({ data });
  return { ok: true, message: id ? "success.saved" : "success.created" };
}

export async function adminDeletePortfolioAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.portfolioProject.delete({ where: { id } }).catch(() => null);
  return { ok: true, message: "success.deleted" };
}

/* ---------- Translations ---------- */

export async function adminSaveTranslationAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const locale = String(fd.get("locale"));
  const key = String(fd.get("key") ?? "").trim();
  const value = String(fd.get("value") ?? "").slice(0, 2000);
  if (!isOneOf(LOCALES, locale)) return fail("errors.invalid");
  // Only existing string keys may be overridden.
  const exists = tk(baseDictionary(locale), key) !== key;
  if (!key || !exists) return fail("errors.notFound", { key: "errors.notFound" });
  await db.translationOverride.upsert({ where: { locale_key: { locale, key } }, create: { locale, key, value }, update: { value } });
  return { ok: true, message: "success.saved" };
}

export async function adminDeleteTranslationAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.translationOverride.delete({ where: { id } }).catch(() => null);
  return { ok: true, message: "success.deleted" };
}
