import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Locale, PackageSlug } from "@/lib/catalog";
import { safeJson } from "@/lib/utils";

export type PackageContent = { name: string; tagline: string; features: string[] };
export type PackageView = {
  id: string;
  slug: PackageSlug;
  priceGel: number;
  isPopular: boolean;
  deliveryDays: number;
} & PackageContent;

export const getPackages = cache(async (locale: Locale): Promise<PackageView[]> => {
  const rows = await db.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((p) => {
    const all = safeJson<Record<string, PackageContent>>(p.content, {});
    const c = all[locale] ?? all.en ?? { name: p.slug, tagline: "", features: [] };
    return { id: p.id, slug: p.slug as PackageSlug, priceGel: p.priceGel, isPopular: p.isPopular, deliveryDays: p.deliveryDays, ...c };
  });
});

export const getPortfolio = cache(async (limit?: number) =>
  db.portfolioProject.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: limit }),
);

export const getPublicReviews = cache(async () =>
  db.review.findMany({ where: { approved: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 9 }),
);
