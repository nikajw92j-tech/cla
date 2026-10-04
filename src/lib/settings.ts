import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_FEATURE_PRICES, type Feature } from "@/lib/catalog";
import { safeJson } from "@/lib/utils";

export type SiteSettings = {
  stats: { websites: number; customers: number; projects: number; responseHours: number };
  rates: { USD: number; RUB: number }; // 1 GEL = x
  pro: { priceGel: number; freeMods: number; modPriceGel: number; proModPriceGel: number; orderDiscountPct: number };
  featurePrices: Record<Feature, number>;
  referral: { enabled: boolean; rewardGel: number; friendDiscountPct: number };
  contact: { email: string; phone: string; address: string; instagram: string; facebook: string; linkedin: string; github: string };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  stats: { websites: 240, customers: 185, projects: 320, responseHours: 2 },
  rates: { USD: 0.37, RUB: 30 },
  pro: { priceGel: 29, freeMods: 5, modPriceGel: 10, proModPriceGel: 6, orderDiscountPct: 10 },
  featurePrices: DEFAULT_FEATURE_PRICES,
  referral: { enabled: true, rewardGel: 20, friendDiscountPct: 10 },
  contact: {
    email: "hello@nexora.ge",
    phone: "+995 555 00 00 00",
    address: "Tbilisi, Georgia",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
};

type Key = keyof SiteSettings;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.setting.findMany().catch(() => []);
  const out = structuredClone(DEFAULT_SETTINGS) as Record<Key, unknown>;
  for (const r of rows) {
    if (r.key in out) {
      const value = safeJson<Record<string, unknown>>(r.value, {});
      out[r.key as Key] = { ...(out[r.key as Key] as object), ...value };
    }
  }
  return out as SiteSettings;
});

export async function saveSetting<K extends Key>(key: K, value: SiteSettings[K]) {
  await db.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
}
