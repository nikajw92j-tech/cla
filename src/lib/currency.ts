// Shared currency math (server + client). Base prices are always GEL.
import { CURRENCY_SYMBOL, type Currency } from "./catalog";

export type Rates = { USD: number; RUB: number };

export function convert(gel: number, currency: Currency, rates: Rates) {
  if (currency === "GEL") return gel;
  const raw = gel * rates[currency];
  return currency === "RUB" ? Math.round(raw / 10) * 10 : Math.round(raw);
}

export function formatMoney(gel: number, currency: Currency, rates: Rates, opts: { approx?: boolean } = {}) {
  const value = convert(gel, currency, rates);
  const num = new Intl.NumberFormat("en-US").format(value).replace(/,/g, currency === "USD" ? "," : " ");
  const s = currency === "USD" ? `$${num}` : `${num} ${CURRENCY_SYMBOL[currency]}`;
  return opts.approx !== false && currency !== "GEL" ? `≈ ${s}` : s;
}

export const formatGel = (gel: number) => `${new Intl.NumberFormat("en-US").format(gel).replace(/,/g, " ")} ₾`;
