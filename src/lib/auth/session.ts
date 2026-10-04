import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SESSION_COOKIE, signSession, verifySession } from "./jwt";

const LONG = 60 * 60 * 24 * 30; // 30 days ("stay logged in")
const SHORT = 60 * 60 * 12; // 12 hours

export async function createSession(user: { id: string; sessionVersion: number; role: string }, remember: boolean) {
  const maxAge = remember ? LONG : SHORT;
  const token = await signSession({ sub: user.id, v: user.sessionVersion, role: user.role }, maxAge);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // session cookie (no maxAge) when the user did not ask to be remembered
    ...(remember ? { maxAge } : {}),
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current user (or null). Cached per request; validates session version so revoked sessions die. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await verifySession(token);
  if (!claims) return null;
  const user = await db.user.findUnique({
    where: { id: claims.sub },
    include: { profile: true, membership: true },
  });
  if (!user || user.sessionVersion !== claims.v) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

/** Admin guard — unknown to non-admins (404 instead of 403). */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();
  return user;
}

export function isProActive(user: { membership: { status: string; currentPeriodEnd: Date } | null }) {
  const m = user.membership;
  return !!m && m.status !== "EXPIRED" && m.currentPeriodEnd > new Date();
}
