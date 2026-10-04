import "server-only";
import { db } from "@/lib/db";
import { FEATURES, PACKAGE_INCLUDED, isOneOf, type Feature, type PackageSlug } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

type PricingUser = {
  id: string;
  membership: { status: string; currentPeriodEnd: Date; freeModsTotal: number; freeModsUsed: number } | null;
} | null;

const proActive = (u: PricingUser) =>
  !!u?.membership && u.membership.status !== "EXPIRED" && u.membership.currentPeriodEnd > new Date();

export type CouponCheck = { ok: true; codeId: string; code: string; discountGel: number } | { ok: false; error: string };

export async function checkCoupon(
  rawCode: string,
  ctx: { purpose: "ORDER" | "MODIFICATION" | "PRO"; amountGel: number; packageSlug?: string; isPro: boolean },
): Promise<CouponCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "errors.couponInvalid" };
  const c = await db.discountCode.findUnique({ where: { code } });
  if (!c || !c.active) return { ok: false, error: "errors.couponInvalid" };
  const now = new Date();
  if ((c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now)) return { ok: false, error: "errors.couponExpired" };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { ok: false, error: "errors.couponExpired" };
  if (c.appliesTo !== "ALL" && c.appliesTo !== ctx.purpose) return { ok: false, error: "errors.couponNotApplicable" };
  if (c.packageSlug && c.packageSlug !== ctx.packageSlug) return { ok: false, error: "errors.couponNotApplicable" };
  if (c.proOnly && !ctx.isPro) return { ok: false, error: "errors.couponProOnly" };
  const raw = c.type === "PERCENT" ? Math.round((ctx.amountGel * Math.min(c.value, 100)) / 100) : c.value;
  return { ok: true, codeId: c.id, code: c.code, discountGel: Math.min(raw, ctx.amountGel) };
}

export type OrderQuote = {
  packageSlug: PackageSlug;
  basePriceGel: number;
  addons: { feature: Feature; priceGel: number }[];
  featuresPriceGel: number;
  autoDiscountGel: number;
  autoDiscountKind: "pro" | "referral" | null;
  couponDiscountGel: number;
  couponCodeId: string | null;
  couponError: string | null;
  discountGel: number;
  totalGel: number;
};

export async function quoteOrder(
  user: PricingUser,
  input: { packageSlug: string; features: string[]; couponCode?: string | null },
): Promise<OrderQuote | null> {
  const pkg = await db.package.findUnique({ where: { slug: input.packageSlug } });
  if (!pkg || !pkg.isActive) return null;
  const slug = pkg.slug as PackageSlug;
  const settings = await getSettings();
  const included = PACKAGE_INCLUDED[slug] ?? [];
  const features = [...new Set(input.features)].filter((f): f is Feature => isOneOf(FEATURES, f));
  const addons = features
    .filter((f) => !included.includes(f))
    .map((f) => ({ feature: f, priceGel: settings.featurePrices[f] ?? 0 }))
    .filter((a) => a.priceGel > 0);
  const featuresPriceGel = addons.reduce((s, a) => s + a.priceGel, 0);
  const gross = pkg.priceGel + featuresPriceGel;

  // One automatic discount: Pro member discount, or first-order referral discount — whichever is larger.
  let autoPct = 0;
  let autoKind: OrderQuote["autoDiscountKind"] = null;
  if (proActive(user)) {
    autoPct = settings.pro.orderDiscountPct;
    autoKind = "pro";
  }
  if (user && settings.referral.enabled && settings.referral.friendDiscountPct > autoPct) {
    const [referred, paidOrders] = await Promise.all([
      db.referral.findUnique({ where: { referredUserId: user.id } }),
      db.order.count({ where: { userId: user.id, status: { in: ["PAID", "IN_PROGRESS", "COMPLETED"] } } }),
    ]);
    if (referred && paidOrders === 0) {
      autoPct = settings.referral.friendDiscountPct;
      autoKind = "referral";
    }
  }
  const autoDiscountGel = Math.round((gross * autoPct) / 100);

  let couponDiscountGel = 0;
  let couponCodeId: string | null = null;
  let couponError: string | null = null;
  if (input.couponCode) {
    const res = await checkCoupon(input.couponCode, {
      purpose: "ORDER",
      amountGel: gross - autoDiscountGel,
      packageSlug: slug,
      isPro: proActive(user),
    });
    if (res.ok) {
      couponDiscountGel = res.discountGel;
      couponCodeId = res.codeId;
    } else couponError = res.error;
  }
  const discountGel = autoDiscountGel + couponDiscountGel;
  return {
    packageSlug: slug,
    basePriceGel: pkg.priceGel,
    addons,
    featuresPriceGel,
    autoDiscountGel,
    autoDiscountKind: autoKind,
    couponDiscountGel,
    couponCodeId,
    couponError,
    discountGel,
    totalGel: Math.max(0, gross - discountGel),
  };
}

export type ModQuote = {
  isPro: boolean;
  priceGel: number;
  discountGel: number;
  finalGel: number;
  usesCredit: boolean;
  creditsLeft: number;
  creditsTotal: number;
  standardPriceGel: number;
  proPriceGel: number;
};

export async function quoteModification(user: PricingUser): Promise<ModQuote> {
  const s = (await getSettings()).pro;
  const isPro = proActive(user);
  const total = user?.membership?.freeModsTotal ?? s.freeMods;
  const left = isPro ? Math.max(0, total - (user!.membership!.freeModsUsed ?? 0)) : 0;
  const base = {
    isPro,
    priceGel: s.modPriceGel,
    creditsLeft: left,
    creditsTotal: total,
    standardPriceGel: s.modPriceGel,
    proPriceGel: s.proModPriceGel,
  };
  if (isPro && left > 0) return { ...base, discountGel: s.modPriceGel, finalGel: 0, usesCredit: true };
  if (isPro) return { ...base, discountGel: s.modPriceGel - s.proModPriceGel, finalGel: s.proModPriceGel, usesCredit: false };
  return { ...base, discountGel: 0, finalGel: s.modPriceGel, usesCredit: false };
}
