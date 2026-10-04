// Shared (server + client) helpers for working with dictionaries.
import type { Dict } from "./dictionaries/en";

/** Replaces {placeholders} in a template. */
export function fmt(template: string, params: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/** Resolves a dotted key ("errors.required") to a string, falling back to the key itself. */
export function tk(dict: Dict, key: string | undefined, params?: Record<string, string | number>) {
  if (!key) return "";
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as object)) cur = (cur as Record<string, unknown>)[part];
    else return key;
  }
  return typeof cur === "string" ? fmt(cur, params) : key;
}

/** Deep-sets a dotted key on a cloned dictionary (used for admin overrides). */
export function applyOverride(dict: Record<string, unknown>, key: string, value: string) {
  const parts = key.split(".");
  let cur: Record<string, unknown> = dict;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur[parts[i]];
    if (!next || typeof next !== "object") return; // only override existing keys
    cur = next as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (typeof cur[last] === "string") cur[last] = value;
}

export const DATE_LOCALE: Record<string, string> = { ka: "ka-GE", en: "en-GB", ru: "ru-RU" };

export function formatDate(d: Date | string, locale: string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale] ?? "en-GB", opts).format(new Date(d));
}

export function formatRelative(d: Date | string, locale: string) {
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(DATE_LOCALE[locale] ?? "en-GB", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(d, locale);
}
