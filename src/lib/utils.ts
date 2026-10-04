import { clsx, type ClassValue } from "clsx";
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Human-friendly reference numbers like NX-7K2F9Q (no ambiguous chars). */
export function refNumber(prefix: string) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${out}`;
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

export function appUrl(path = "") {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}
