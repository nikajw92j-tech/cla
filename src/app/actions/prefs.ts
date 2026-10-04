"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { CURRENCIES, LOCALES, isOneOf } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/session";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { CURRENCY_COOKIE, THEME_COOKIE } from "@/lib/prefs";

const YEAR = 60 * 60 * 24 * 365;
const opts = { path: "/", maxAge: YEAR, sameSite: "lax" as const, httpOnly: false };

export async function setLocaleAction(locale: string) {
  if (!isOneOf(LOCALES, locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, opts);
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { locale } });
}

export async function setCurrencyAction(currency: string) {
  if (!isOneOf(CURRENCIES, currency)) return;
  (await cookies()).set(CURRENCY_COOKIE, currency, opts);
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { currency } });
}

export async function setThemeAction(theme: string) {
  if (theme !== "light" && theme !== "dark") return;
  (await cookies()).set(THEME_COOKIE, theme, opts);
}
