"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { fail, formObject, zodFail, type ActionResult } from "@/lib/action";
import { requireUser, destroySession, isProActive } from "@/lib/auth/session";
import { changePasswordSchema, profileSchema, reviewSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { filesFrom, saveFiles, validateFiles, deleteStoredFile, UploadError } from "@/lib/uploads";
import { createPayment, confirmPayment, failPayment, paymentProvider } from "@/lib/payments";
import { getCurrency } from "@/lib/prefs";
import { getSettings } from "@/lib/settings";
import { notify } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";

/* ---------- Profile & settings ---------- */

export async function updateProfileAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const { firstName, lastName, ...profile } = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      profile: {
        upsert: {
          create: { phone: profile.phone ?? null, company: profile.company ?? null, country: profile.country ?? null, bio: profile.bio ?? null },
          update: { phone: profile.phone ?? null, company: profile.company ?? null, country: profile.country ?? null, bio: profile.bio ?? null },
        },
      },
    },
  });
  return { ok: true, message: "success.saved" };
}

export async function uploadAvatarAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("avatar", 10, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  const files = filesFrom(fd, "avatar");
  if (files.length !== 1) return fail("errors.required");
  const err = validateFiles(files, 1, true);
  if (err) return fail(err);
  try {
    const [saved] = await saveFiles(user.id, files, "AVATAR");
    const oldId = user.profile?.avatarFileId;
    await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, avatarFileId: saved.id }, update: { avatarFileId: saved.id } });
    if (oldId) {
      const old = await db.fileUpload.findUnique({ where: { id: oldId } });
      if (old) {
        await db.fileUpload.delete({ where: { id: old.id } });
        await deleteStoredFile(old.storedName);
      }
    }
    return { ok: true, message: "success.saved" };
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "errors.generic");
  }
}

export async function updateNotificationPrefsAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const on = (k: string) => fd.get(k) === "on";
  const data = { emailOnStatus: on("emailOnStatus"), emailOnMessages: on("emailOnMessages"), emailOnBilling: on("emailOnBilling"), emailMarketing: on("emailMarketing") };
  await db.profile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  return { ok: true, message: "success.saved" };
}

export async function changePasswordAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await rateLimit("change-pw", 5, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  const parsed = changePasswordSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) return fail("errors.wrongPassword", { currentPassword: "errors.wrongPassword" });
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 } } });
  await destroySession();
  return { ok: true, message: "success.passwordChanged", redirect: "/login" };
}

export async function logoutAllAction() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  await destroySession();
  redirect("/login");
}

/* ---------- Pro membership ---------- */

export async function subscribeProAction(): Promise<ActionResult> {
  const user = await requireUser();
  if (isProActive(user) && user.membership?.status === "ACTIVE") return fail("errors.alreadyPro");
  if (!(await rateLimit("pro-sub", 5, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  const settings = await getSettings();
  const currency = await getCurrency();
  const payment = await createPayment({
    userId: user.id,
    purpose: "PRO",
    amountGel: settings.pro.priceGel,
    method: "CARD",
    currency,
    rate: currency === "GEL" ? 1 : settings.rates[currency],
    items: [{ label: "pro:monthly", amountGel: settings.pro.priceGel }],
  });
  const { url } = await paymentProvider.createCheckout(payment.id);
  return { ok: true, redirect: url };
}

export async function cancelProAction(): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.membership) return fail("errors.notFound");
  await db.proMembership.update({ where: { userId: user.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  await notify(user.id, "proCancelled", {}, { link: "/dashboard/pro", channel: "billing" });
  return { ok: true, message: "success.proCancelled" };
}

export async function resumeProAction(): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.membership || !isProActive(user)) return fail("errors.notFound");
  await db.proMembership.update({ where: { userId: user.id }, data: { status: "ACTIVE", cancelledAt: null } });
  return { ok: true, message: "success.proResumed" };
}

/* ---------- Checkout (test provider) ---------- */

/** Resolves a hosted-checkout session in test mode. Only the payment's owner can act on it. */
export async function completeTestPaymentAction(paymentId: string, outcome: "approve" | "decline"): Promise<ActionResult> {
  const user = await requireUser();
  const payment = await db.payment.findFirst({ where: { id: paymentId, userId: user.id } });
  if (!payment || payment.status !== "PENDING") return fail("errors.notFound");
  if (outcome === "decline") {
    await failPayment(paymentId);
    return { ok: true, redirect: `/checkout/${paymentId}?status=failed` };
  }
  await confirmPayment(paymentId, `test_${Date.now()}`);
  const next =
    payment.purpose === "PRO"
      ? "/dashboard/pro?activated=1"
      : payment.purpose === "ORDER"
        ? `/dashboard/orders/${payment.orderId}?success=1`
        : `/dashboard/requests/${payment.requestId}?new=1`;
  return { ok: true, redirect: next };
}

export async function resumePaymentAction(paymentId: string): Promise<ActionResult> {
  const user = await requireUser();
  const payment = await db.payment.findFirst({ where: { id: paymentId, userId: user.id, status: { in: ["PENDING", "FAILED"] } } });
  if (!payment) return fail("errors.notFound");
  if (payment.status === "FAILED") await db.payment.update({ where: { id: payment.id }, data: { status: "PENDING" } });
  const { url } = await paymentProvider.createCheckout(payment.id);
  return { ok: true, redirect: url };
}

/* ---------- Reviews ---------- */

export async function submitReviewAction(fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const website = await db.website.findFirst({ where: { id: parsed.data.websiteId, userId: user.id } });
  if (!website || website.stage !== "COMPLETED") return fail("errors.cannotReview");
  if (await db.review.findFirst({ where: { userId: user.id, websiteId: website.id } })) return fail("errors.alreadyReviewed");
  await db.review.create({ data: { ...parsed.data, userId: user.id } });
  return { ok: true, message: "success.reviewSent" };
}
