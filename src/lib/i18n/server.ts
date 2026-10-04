import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, isOneOf, LOCALES, type Locale } from "@/lib/catalog";
import en, { type Dict } from "./dictionaries/en";
import ka from "./dictionaries/ka";
import ru from "./dictionaries/ru";
import { applyOverride } from "./format";

export const LOCALE_COOKIE = "nx_locale";
const base: Record<Locale, Dict> = { en, ka, ru };

export const getLocale = cache(async (): Promise<Locale> => {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isOneOf(LOCALES, c)) return c;
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isOneOf(LOCALES, code)) return code;
  }
  return DEFAULT_LOCALE;
});

/** Dictionary for a locale with admin overrides from the DB applied. */
export const getDictionary = cache(async (locale?: Locale): Promise<Dict> => {
  const loc = locale ?? (await getLocale());
  const overrides = await db.translationOverride.findMany({ where: { locale: loc } }).catch(() => []);
  if (!overrides.length) return base[loc];
  const clone = structuredClone(base[loc]) as unknown as Record<string, unknown>;
  for (const o of overrides) applyOverride(clone, o.key, o.value);
  return clone as unknown as Dict;
});

export async function getI18n() {
  const locale = await getLocale();
  const d = await getDictionary(locale);
  return { locale, d };
}

export function baseDictionary(locale: Locale) {
  return base[locale];
}
