// Pure estimate engine shared by the price calculator, the free-estimate funnel and the server.
import { PACKAGE_INCLUDED, type Feature, type PackageSlug, type WebsiteType } from "./catalog";

const TIER: PackageSlug[] = ["essential", "premium", "ultimate"];

const TYPE_MIN_TIER: Record<WebsiteType, number> = {
  LANDING: 0,
  PORTFOLIO: 0,
  BUSINESS: 1,
  BOOKING: 1,
  ECOMMERCE: 2,
  CUSTOM: 2,
};

/** Features implied by a website type (pre-selected in the calculator). */
export const TYPE_FEATURES: Record<WebsiteType, Feature[]> = {
  LANDING: ["CONTACT_FORM"],
  PORTFOLIO: ["PORTFOLIO", "GALLERY", "CONTACT_FORM"],
  BUSINESS: ["CONTACT_FORM", "SOCIAL"],
  BOOKING: ["BOOKING", "CONTACT_FORM"],
  ECOMMERCE: ["STORE", "ACCOUNTS"],
  CUSTOM: ["ACCOUNTS", "ADMIN"],
};

const HEAVY: Feature[] = ["STORE", "ACCOUNTS", "ADMIN"];

export type EstimateResult = { packageSlug: PackageSlug; totalGel: number; basePriceGel: number; addons: { feature: Feature; priceGel: number }[] };

export function estimate(
  input: { type: WebsiteType; features: Feature[]; pages: number },
  prices: { packages: Record<string, number>; features: Record<Feature, number> },
): EstimateResult {
  let minTier = TYPE_MIN_TIER[input.type];
  if (input.pages > 5) minTier = Math.max(minTier, 1);
  if (input.pages > 12) minTier = Math.max(minTier, 2);
  if (input.features.filter((f) => HEAVY.includes(f)).length >= 2) minTier = Math.max(minTier, 2);

  let best: EstimateResult | null = null;
  for (let i = minTier; i < TIER.length; i++) {
    const slug = TIER[i];
    const base = prices.packages[slug];
    if (base == null) continue;
    const addons = input.features
      .filter((f) => !PACKAGE_INCLUDED[slug].includes(f))
      .map((f) => ({ feature: f, priceGel: prices.features[f] ?? 0 }))
      .filter((a) => a.priceGel > 0);
    const total = base + addons.reduce((s, a) => s + a.priceGel, 0);
    if (!best || total < best.totalGel) best = { packageSlug: slug, totalGel: total, basePriceGel: base, addons };
  }
  return best ?? { packageSlug: "premium", totalGel: prices.packages.premium ?? 300, basePriceGel: prices.packages.premium ?? 300, addons: [] };
}
