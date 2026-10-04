"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { fail, zodFail, type ActionResult } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { orderBriefSchema } from "@/lib/validation";
import { FEATURES, PACKAGE_SLUGS, STYLES, WEBSITE_TYPES, isOneOf } from "@/lib/catalog";
import { quoteOrder, type OrderQuote } from "@/lib/pricing";
import { createPayment, confirmPayment, paymentProvider } from "@/lib/payments";
import { filesFrom, saveFiles, validateFiles, deleteStoredFile, UploadError } from "@/lib/uploads";
import { notify, logActivity } from "@/lib/notify";
import { getCurrency } from "@/lib/prefs";
import { getSettings } from "@/lib/settings";
import { refNumber } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

const draftSchema = z.object({
  packageSlug: z.enum(PACKAGE_SLUGS).optional(),
  brandName: z.string().max(120).optional(),
  websiteType: z.string().optional(),
  industry: z.string().max(120).optional(),
  description: z.string().max(4000).optional(),
  colors: z.string().max(300).optional(),
  style: z.string().optional(),
  pagesCount: z.coerce.number().int().min(1).max(100).optional(),
  functionality: z.string().max(2000).optional(),
  examples: z.string().max(2000).optional(),
  features: z.array(z.string()).max(20).optional(),
  step: z.number().int().min(1).max(6),
});

export type DraftInput = z.input<typeof draftSchema>;

async function ownDraft(userId: string, orderId: string) {
  const order = await db.order.findFirst({ where: { id: orderId, userId } });
  return order && order.status === "DRAFT" ? order : null;
}

/** Saves (or creates) an order draft. Partial data is fine; full validation happens at submit. */
export async function saveOrderDraftAction(orderId: string | null, input: DraftInput): Promise<ActionResult<{ orderId: string }>> {
  const user = await requireUser();
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;

  const pkg = v.packageSlug ? await db.package.findUnique({ where: { slug: v.packageSlug } }) : null;
  const data = {
    ...(pkg ? { packageId: pkg.id, basePriceGel: pkg.priceGel } : {}),
    brandName: v.brandName,
    websiteType: isOneOf(WEBSITE_TYPES, v.websiteType) ? v.websiteType : undefined,
    industry: v.industry,
    description: v.description,
    colors: v.colors,
    style: isOneOf(STYLES, v.style) ? v.style : undefined,
    pagesCount: v.pagesCount,
    functionality: v.functionality,
    examples: v.examples,
    ...(v.features ? { features: JSON.stringify(v.features.filter((f) => isOneOf(FEATURES, f))) } : {}),
    draftStep: v.step,
  };

  if (orderId) {
    const existing = await ownDraft(user.id, orderId);
    if (!existing) return fail("errors.notFound");
    await db.order.update({ where: { id: orderId }, data });
    return { ok: true, data: { orderId } };
  }
  if (!(await rateLimit("draft-create", 20, 60 * 60_000, user.id))) return fail("errors.rateLimited");
  const order = await db.order.create({ data: { ...data, userId: user.id, number: refNumber("NX") } });
  await logActivity(user.id, "orderCreated", { number: order.number });
  return { ok: true, data: { orderId: order.id } };
}

export async function uploadOrderFilesAction(orderId: string, fd: FormData): Promise<ActionResult<{ files: { id: string; originalName: string; mimeType: string; size: number }[] }>> {
  const user = await requireUser();
  const order = await ownDraft(user.id, orderId);
  if (!order) return fail("errors.notFound");
  const files = filesFrom(fd);
  const existing = await db.fileUpload.count({ where: { orderId } });
  const err = validateFiles(files, Math.max(0, 20 - existing));
  if (err) return fail(err);
  try {
    const saved = await saveFiles(user.id, files, "ORDER", { orderId });
    return { ok: true, data: { files: saved.map(({ id, originalName, mimeType, size }) => ({ id, originalName, mimeType, size })) } };
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "errors.generic");
  }
}

export async function removeOrderFileAction(orderId: string, fileId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await ownDraft(user.id, orderId))) return fail("errors.notFound");
  const file = await db.fileUpload.findFirst({ where: { id: fileId, orderId, userId: user.id } });
  if (!file) return fail("errors.notFound");
  await db.fileUpload.delete({ where: { id: file.id } });
  await deleteStoredFile(file.storedName);
  return { ok: true };
}

export async function quoteOrderAction(orderId: string, coupon?: string): Promise<ActionResult<OrderQuote>> {
  const user = await requireUser();
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { package: true } });
  if (!order?.package) return fail("errors.selectPackage");
  const quote = await quoteOrder(user, { packageSlug: order.package.slug, features: JSON.parse(order.features), couponCode: coupon || null });
  if (!quote) return fail("errors.selectPackage");
  return { ok: true, data: quote };
}

export async function submitOrderAction(orderId: string, input: { method: string; coupon?: string; agree: boolean }): Promise<ActionResult<{ checkoutUrl?: string }>> {
  const user = await requireUser();
  if (!(await rateLimit("order-submit", 10, 60_000, user.id))) return fail("errors.rateLimited");
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { package: true } });
  if (!order || order.status !== "DRAFT") return fail("errors.notFound");
  if (!order.package) return fail("errors.selectPackage");
  if (!input.agree) return fail("errors.checkForm", { agree: "errors.required" });
  if (input.method !== "CARD" && input.method !== "BANK_TRANSFER") return fail("errors.checkForm");

  // Server-side validation of the whole brief — never trust the client wizard.
  const brief = orderBriefSchema.safeParse({
    brandName: order.brandName ?? "",
    websiteType: order.websiteType ?? "",
    industry: order.industry ?? "",
    description: order.description ?? "",
    colors: order.colors ?? undefined,
    style: order.style ?? undefined,
    pagesCount: order.pagesCount ?? 0,
    functionality: order.functionality ?? undefined,
    examples: order.examples ?? undefined,
  });
  if (!brief.success) return zodFail(brief.error);

  const quote = await quoteOrder(user, { packageSlug: order.package.slug, features: JSON.parse(order.features), couponCode: input.coupon || null });
  if (!quote) return fail("errors.selectPackage");
  if (input.coupon && quote.couponError) return fail(quote.couponError, { coupon: quote.couponError });

  const currency = await getCurrency();
  const rates = (await getSettings()).rates;
  const rate = currency === "GEL" ? 1 : rates[currency];

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "PENDING_PAYMENT",
      basePriceGel: quote.basePriceGel,
      featuresPriceGel: quote.featuresPriceGel,
      discountGel: quote.discountGel,
      totalGel: quote.totalGel,
      discountCodeId: quote.couponCodeId,
      paymentMethod: input.method,
      submittedAt: new Date(),
    },
  });

  const payment = await createPayment({
    userId: user.id,
    purpose: "ORDER",
    orderId: order.id,
    amountGel: quote.totalGel,
    method: input.method,
    currency,
    rate,
    discountGel: quote.discountGel,
    items: [
      { label: `package:${quote.packageSlug}`, amountGel: quote.basePriceGel },
      ...quote.addons.map((a) => ({ label: `feature:${a.feature}`, amountGel: a.priceGel })),
    ],
  });

  await logActivity(user.id, "orderSubmitted", { number: order.number });
  await notify(user.id, "orderSubmitted", { number: order.number }, { link: `/dashboard/orders/${order.id}`, channel: "billing" });

  if (quote.totalGel === 0) {
    await confirmPayment(payment.id, "zero-amount");
    return { ok: true, data: {} };
  }
  if (input.method === "CARD") {
    const { url } = await paymentProvider.createCheckout(payment.id);
    return { ok: true, data: { checkoutUrl: url } };
  }
  return { ok: true, data: {} };
}

export async function deleteDraftAction(orderId: string): Promise<ActionResult> {
  const user = await requireUser();
  const order = await ownDraft(user.id, orderId);
  if (!order) return fail("errors.notFound");
  const files = await db.fileUpload.findMany({ where: { orderId } });
  await db.order.delete({ where: { id: orderId } });
  await Promise.all(files.map((f) => deleteStoredFile(f.storedName)));
  return { ok: true, message: "success.deleted", redirect: "/dashboard/orders" };
}

/** Restarts payment for an order that is awaiting payment (e.g. after a declined card). */
export async function retryOrderPaymentAction(orderId: string): Promise<ActionResult> {
  const user = await requireUser();
  const payment = await db.payment.findFirst({ where: { orderId, userId: user.id, status: { in: ["PENDING", "FAILED"] } }, orderBy: { createdAt: "desc" } });
  if (!payment) return fail("errors.notFound");
  if (payment.status === "FAILED") await db.payment.update({ where: { id: payment.id }, data: { status: "PENDING", method: "CARD" } });
  const { url } = await paymentProvider.createCheckout(payment.id);
  return { ok: true, redirect: url };
}
