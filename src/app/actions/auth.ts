"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { fail, formObject, zodFail, type ActionResult } from "@/lib/action";
import { loginSchema, registerSchema, resetSchema, email as emailSchema } from "@/lib/validation";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { issueToken, consumeToken } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { notify } from "@/lib/notify";
import { appUrl } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";

function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function loginAction(fd: FormData): Promise<ActionResult> {
  const raw = formObject(fd);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const { email, password, remember } = parsed.data;
  if (!(await rateLimit("login-ip", 20, 60_000)) || !(await rateLimit("login-email", 6, 60_000, email))) return fail("errors.rateLimited");

  const user = await db.user.findUnique({ where: { email } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyAgainstDummy(password);
  if (!user || !ok) return fail("errors.invalidCredentials", { password: "errors.invalidCredentials" });

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user, remember === "on");
  return { ok: true, redirect: safeNext(raw.next, user.role === "ADMIN" ? "/admin" : "/dashboard") };
}

async function uniqueReferralCode(firstName: string) {
  const base = firstName.normalize("NFKD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5) || "NX";
  for (let i = 0; i < 5; i++) {
    const code = `${base}${randomBytes(3).toString("hex").toUpperCase()}`;
    if (!(await db.referralCode.findUnique({ where: { code } }))) return code;
  }
  return `NX${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function registerAction(fd: FormData): Promise<ActionResult> {
  if (!(await rateLimit("register", 5, 10 * 60_000))) return fail("errors.rateLimited");
  const raw = formObject(fd);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;

  if (await db.user.findUnique({ where: { email: v.email } })) return fail("errors.emailTaken", { email: "errors.emailTaken" });

  const { locale } = await getI18n();
  const referrer = v.referral ? await db.referralCode.findUnique({ where: { code: v.referral.trim().toUpperCase() } }) : null;

  const user = await db.user.create({
    data: {
      email: v.email,
      passwordHash: await hashPassword(v.password),
      firstName: v.firstName,
      lastName: v.lastName,
      locale,
      profile: { create: { phone: v.phone, company: v.company } },
      referralCode: { create: { code: await uniqueReferralCode(v.firstName) } },
    },
  });
  if (referrer && referrer.userId !== user.id) {
    await db.referral.create({ data: { referrerId: referrer.userId, referredUserId: user.id } });
  }

  await sendVerification(user.id, user.email);
  await notify(user.id, "welcome", {}, { channel: "none", link: "/dashboard" });
  await createSession(user, true);
  return { ok: true, redirect: safeNext(raw.next, "/dashboard") };
}

async function sendVerification(userId: string, email: string) {
  const { d } = await getI18n();
  const token = await issueToken(userId, "VERIFY_EMAIL");
  await sendMail(email, d.auth.verifyTitle, d.auth.verifyBanner, { label: d.auth.verifyTitle, url: appUrl(`/verify-email?token=${token}`) });
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("errors.forbidden");
  if (!(await rateLimit("verify-resend", 3, 10 * 60_000, user.id))) return fail("errors.rateLimited");
  if (!user.emailVerified) await sendVerification(user.id, user.email);
  return { ok: true, message: "auth.resent" };
}

export async function verifyEmailToken(token: string) {
  const userId = await consumeToken(token, "VERIFY_EMAIL");
  if (!userId) return false;
  await db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  return true;
}

export async function forgotPasswordAction(fd: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return fail("errors.checkForm", { email: "errors.invalidEmail" });
  if (!(await rateLimit("forgot", 5, 10 * 60_000)) || !(await rateLimit("forgot-email", 3, 10 * 60_000, parsed.data))) return fail("errors.rateLimited");
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const { d } = await getI18n();
    const token = await issueToken(user.id, "RESET_PASSWORD");
    await sendMail(user.email, d.auth.forgotTitle, d.auth.resetSubtitle, { label: d.auth.resetTitle, url: appUrl(`/reset-password?token=${token}`) });
  }
  // Same response either way — don't reveal which emails are registered.
  return { ok: true, message: "auth.forgotSent" };
}

export async function resetPasswordAction(fd: FormData): Promise<ActionResult> {
  if (!(await rateLimit("reset", 10, 10 * 60_000))) return fail("errors.rateLimited");
  const parsed = resetSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodFail(parsed.error);
  const userId = await consumeToken(parsed.data.token, "RESET_PASSWORD");
  if (!userId) return fail("errors.tokenInvalid");
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 }, emailVerified: new Date() },
  });
  return { ok: true, message: "auth.resetDone", redirect: "/login" };
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
