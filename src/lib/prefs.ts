import "server-only";
import { cookies } from "next/headers";
import { CURRENCIES, isOneOf, type Currency } from "./catalog";

export const CURRENCY_COOKIE = "nx_currency";
export const THEME_COOKIE = "nx_theme";

export async function getCurrency(): Promise<Currency> {
  const c = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isOneOf(CURRENCIES, c) ? c : "GEL";
}

export async function getTheme(): Promise<"light" | "dark"> {
  return (await cookies()).get(THEME_COOKIE)?.value === "light" ? "light" : "dark";
}
