"use server";

import { db } from "@/lib/db";
import { fail, zodFail, type ActionResult } from "@/lib/action";
import { leadSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { estimate } from "@/lib/estimate";
import { getSettings } from "@/lib/settings";
import { FEATURES, isOneOf, type Feature } from "@/lib/catalog";

export async function submitLeadAction(input: unknown): Promise<ActionResult<{ packageSlug: string; totalGel: number }>> {
  if (!(await rateLimit("lead", 5, 60_000))) return fail("errors.rateLimited");
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);
  const v = parsed.data;
  const features = v.features.filter((f): f is Feature => isOneOf(FEATURES, f));

  const [settings, packages] = await Promise.all([getSettings(), db.package.findMany({ where: { isActive: true } })]);
  const result = estimate(
    { type: v.websiteType, features, pages: v.pages },
    { packages: Object.fromEntries(packages.map((p) => [p.slug, p.priceGel])), features: settings.featurePrices },
  );
  await db.lead.create({
    data: {
      name: v.name,
      email: v.email,
      websiteType: v.websiteType,
      features: JSON.stringify(features),
      pages: v.pages,
      timeline: v.timeline,
      recommended: result.packageSlug,
      estimateGel: result.totalGel,
    },
  });
  return { ok: true, data: { packageSlug: result.packageSlug, totalGel: result.totalGel } };
}
