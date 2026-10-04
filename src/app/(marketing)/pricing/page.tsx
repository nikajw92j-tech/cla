import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PricingCards } from "@/components/home/sections";
import { Faq } from "@/components/home/faq-reviews";
import { Aurora, SectionHeading } from "@/components/site/motion";
import { Money } from "@/components/ui/misc";
import { getI18n } from "@/lib/i18n/server";
import { getPackages } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { FEATURES, PACKAGE_INCLUDED } from "@/lib/catalog";
import { fmt } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.pricing.title, description: d.pricing.subtitle, alternates: { canonical: "/pricing" } };
}

export default async function PricingPage() {
  const { d, locale } = await getI18n();
  const [packages, settings] = await Promise.all([getPackages(locale), getSettings()]);

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
        <Aurora />
        <div className="container-x relative">
          <SectionHeading title={d.pricing.title} subtitle={d.pricing.subtitle} />
          <PricingCards packages={packages} />
          <p className="mt-6 text-center text-sm text-muted">{fmt(d.pricing.proNote, { pct: settings.pro.orderDiscountPct })}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x">
          <SectionHeading title={d.pricing.addonsTitle} subtitle={d.pricing.addonsSubtitle} />
          <div className="glass overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-6 py-4 font-medium text-muted">{d.pricing.compareTitle}</th>
                  {packages.map((p) => (
                    <th key={p.id} className="px-6 py-4 text-center font-semibold text-fg">
                      {p.name}
                      <div className="mt-0.5 text-xs font-normal text-muted">
                        <Money gel={p.priceGel} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-6 py-3.5 text-fg-soft">{d.labels.feature[f]}</td>
                    {packages.map((p) => {
                      const inc = PACKAGE_INCLUDED[p.slug]?.includes(f);
                      const price = settings.featurePrices[f];
                      return (
                        <td key={p.id} className="px-6 py-3.5 text-center">
                          {inc ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <Check className="size-4" strokeWidth={3} />
                              <span className="sr-only">{d.pricing.included}</span>
                            </span>
                          ) : price > 0 ? (
                            <span className="text-fg-soft">
                              +<Money gel={price} />
                            </span>
                          ) : (
                            <Minus className="mx-auto size-4 text-muted" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Faq />
    </>
  );
}
