"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Briefcase, Calendar, Check, Cpu, LayoutTemplate, ShoppingCart, User } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { FEATURES, PACKAGE_INCLUDED, WEBSITE_TYPES, type Feature, type WebsiteType } from "@/lib/catalog";
import { estimate, TYPE_FEATURES } from "@/lib/estimate";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/motion";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<WebsiteType, typeof Briefcase> = {
  BUSINESS: Briefcase,
  PORTFOLIO: User,
  LANDING: LayoutTemplate,
  ECOMMERCE: ShoppingCart,
  BOOKING: Calendar,
  CUSTOM: Cpu,
};

export function Calculator({ packagePrices, packageNames, featurePrices }: { packagePrices: Record<string, number>; packageNames: Record<string, string>; featurePrices: Record<Feature, number> }) {
  const { d, money, currency } = useApp();
  const c = d.home.calculator;
  const [type, setType] = useState<WebsiteType>("BUSINESS");
  const [features, setFeatures] = useState<Feature[]>(TYPE_FEATURES.BUSINESS);
  const [pages, setPages] = useState(5);

  const result = useMemo(() => estimate({ type, features, pages }, { packages: packagePrices, features: featurePrices }), [type, features, pages, packagePrices, featurePrices]);
  const included = PACKAGE_INCLUDED[result.packageSlug];

  const pickType = (t: WebsiteType) => {
    setType(t);
    setFeatures(TYPE_FEATURES[t]);
  };
  const toggle = (f: Feature) => setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  return (
    <section id="calculator" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="glass space-y-8 rounded-3xl p-6 sm:p-8">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-fg">{c.typeLabel}</legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {WEBSITE_TYPES.map((t) => {
                  const Icon = TYPE_ICONS[t];
                  const active = t === type;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => pickType(t)}
                      aria-pressed={active}
                      className={cn(
                        "relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition-all",
                        active ? "border-brand/60 bg-brand/[0.08] text-fg" : "border-line text-fg-soft hover:border-line-strong hover:bg-fg/[0.02]",
                      )}
                    >
                      <Icon className={cn("size-5 transition-colors", active ? "text-brand" : "text-muted")} />
                      {d.labels.websiteType[t]}
                      {active && <motion.span layoutId="calc-type" className="absolute inset-0 rounded-2xl ring-2 ring-brand/50" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-fg">{c.featuresLabel}</legend>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => {
                  const on = features.includes(f);
                  return (
                    <motion.button
                      key={f}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggle(f)}
                      aria-pressed={on}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                        on ? "border-brand/50 bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong",
                      )}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                      {d.labels.feature[f]}
                    </motion.button>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="calc-pages" className="mb-3 flex items-center justify-between text-sm font-semibold text-fg">
                {c.pagesLabel}
                <span className="rounded-lg bg-fg/[0.06] px-2.5 py-1 font-display text-base">{pages}</span>
              </label>
              <input
                id="calc-pages"
                type="range"
                min={1}
                max={30}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
            </div>
          </div>

          <div className="relative lg:sticky lg:top-24 lg:self-start">
            <div className="border-gradient relative overflow-hidden rounded-3xl p-7 shadow-[0_30px_80px_-30px_var(--brand)] sm:p-8">
              <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-brand/25 blur-3xl" />
              <p className="relative text-sm text-muted">{c.estimate}</p>
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={`${result.totalGel}-${currency}`}
                  initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                  transition={{ duration: 0.35 }}
                  className="relative mt-1 font-display text-5xl font-semibold tracking-tight text-fg"
                >
                  {money(result.totalGel)}
                </motion.p>
              </AnimatePresence>
              <div className="relative mt-6 rounded-2xl border border-line bg-fg/[0.03] p-4">
                <p className="text-xs text-muted">{c.recommended}</p>
                <p className="mt-1 text-lg font-semibold text-fg">{packageNames[result.packageSlug]}</p>
                <p className="text-sm text-muted">{money(result.basePriceGel)}</p>
              </div>
              {result.addons.length > 0 && (
                <div className="relative mt-4">
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">{c.addons}</p>
                  <ul className="space-y-1.5 text-sm">
                    {result.addons.map((a) => (
                      <li key={a.feature} className="flex justify-between text-fg-soft">
                        <span>{d.labels.feature[a.feature]}</span>
                        <span>+{money(a.priceGel)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="relative mt-4">
                <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">{c.includes}</p>
                <div className="flex flex-wrap gap-1.5">
                  {included.map((f) => (
                    <span key={f} className="rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">
                      {d.labels.feature[f]}
                    </span>
                  ))}
                </div>
              </div>
              <ButtonLink
                href={`/dashboard/orders/new?package=${result.packageSlug}&features=${features.join(",")}&type=${type}&pages=${pages}`}
                className="relative mt-7 w-full"
                size="lg"
                iconRight={<ArrowRight className="size-4" />}
              >
                {c.cta}
              </ButtonLink>
              <p className="relative mt-4 text-xs leading-relaxed text-muted">{c.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
