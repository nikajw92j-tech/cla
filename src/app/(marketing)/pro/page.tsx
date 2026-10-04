import type { Metadata } from "next";
import { ArrowRight, BadgePercent, Check, Clock, Crown, Gauge, Headphones, LayoutDashboard, Rocket, Sparkles, Wand2, X } from "lucide-react";
import { Aurora, Reveal, SectionHeading, SpotlightCard } from "@/components/site/motion";
import { ButtonLink } from "@/components/ui/button";
import { Money, ProBadge } from "@/components/ui/misc";
import { Faq } from "@/components/home/faq-reviews";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { getCurrentUser, isProActive } from "@/lib/auth/session";
import { fmt } from "@/lib/i18n/format";
import { formatGel } from "@/lib/currency";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.pro.title, description: d.pro.subtitle, alternates: { canonical: "/pro" } };
}

const ICONS = [Wand2, BadgePercent, Headphones, Clock, Rocket, Crown, Sparkles, Gauge, LayoutDashboard];

export default async function ProPage() {
  const [{ d }, settings, user] = await Promise.all([getI18n(), getSettings(), getCurrentUser()]);
  const s = settings.pro;
  const active = user ? isProActive(user) : false;
  const ctaHref = user ? "/dashboard/pro" : "/register?next=/dashboard/pro";
  const standardTotal = s.modPriceGel * s.freeMods;

  const rows: [string, React.ReactNode, React.ReactNode][] = [
    [d.pro.rows.modPrice, <Money key="a" gel={s.modPriceGel} />, <span key="b">{d.common.free} → <Money gel={s.proModPriceGel} /></span>],
    [d.pro.rows.freeMods, <X key="c" className="mx-auto size-4 text-muted" />, <span key="d" className="font-semibold text-fg">{s.freeMods}</span>],
    [d.pro.rows.support, d.pro.rows.standard, d.pro.rows.priority],
    [d.pro.rows.queue, d.pro.rows.standard, d.pro.rows.priority],
    [d.pro.rows.discount, <X key="e" className="mx-auto size-4 text-muted" />, `${s.orderDiscountPct}%`],
  ];

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
        <Aurora />
        <div className="pointer-events-none absolute top-20 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-[#f5b544]/15 blur-3xl" />
        <div className="container-x relative text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f5b544]/30 bg-[#f5b544]/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#d99a2b] uppercase dark:text-[#f7cf73]">
              <Crown className="size-3.5" /> {d.pro.title}
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-fg sm:text-6xl">{d.pro.subtitle}</h1>
            <div className="mt-10 inline-flex flex-col items-center">
              <p className="font-display text-6xl font-semibold tracking-tight text-fg">
                <Money gel={s.priceGel} approx={false} />
                <span className="ml-2 align-middle font-sans text-lg font-normal text-muted">{d.common.perMonth}</span>
              </p>
              <p className="mt-2 text-sm text-muted">{d.pro.cancelAnytime}</p>
              {active ? (
                <ButtonLink href="/dashboard/pro" variant="gold" size="lg" className="mt-8" icon={<ProBadge className="!bg-none !p-0" />}>
                  {d.pro.active}
                </ButtonLink>
              ) : (
                <ButtonLink href={ctaHref} variant="gold" size="lg" className="mt-8" iconRight={<ArrowRight className="size-4" />}>
                  {user ? d.pro.subscribe : d.pro.loginToSubscribe}
                </ButtonLink>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="container-x">
          <SectionHeading title={d.pro.perksTitle} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.pro.perks.map((p, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Reveal key={p.title} delay={(i % 3) * 0.08}>
                  <SpotlightCard className="h-full rounded-3xl" glow="#f5b544">
                    <div className="glass h-full rounded-3xl p-6">
                      <div className="mb-4 grid size-11 place-items-center rounded-xl bg-[#f5b544]/12 text-[#d99a2b] dark:text-[#f7cf73]">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="font-semibold text-fg">{p.title}</h3>
                      <p className="mt-1.5 text-sm text-muted">{p.desc}</p>
                    </div>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-x grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="glass overflow-hidden rounded-3xl">
            <table className="w-full text-sm">
              <caption className="border-b border-line px-6 py-4 text-left font-semibold text-fg">{d.pro.compare.title}</caption>
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="px-6 py-3 text-left font-medium">{d.pro.compare.feature}</th>
                  <th className="px-4 py-3 text-center font-medium">{d.pro.compare.free}</th>
                  <th className="px-4 py-3 text-center font-medium">
                    <ProBadge />
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, free, pro]) => (
                  <tr key={label} className="border-b border-line last:border-0">
                    <td className="px-6 py-3.5 text-fg-soft">{label}</td>
                    <td className="px-4 py-3.5 text-center text-muted">{free}</td>
                    <td className="bg-[#f5b544]/[0.05] px-4 py-3.5 text-center text-fg">{pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal delay={0.1} className="relative overflow-hidden rounded-3xl border border-[#f5b544]/25 bg-[linear-gradient(160deg,color-mix(in_oklab,#f5b544_12%,var(--card-solid)),var(--card-solid))] p-8">
            <h3 className="font-display text-xl font-semibold text-fg">{d.pro.savingsTitle}</h3>
            <p className="mt-3 text-muted">{fmt(d.pro.savingsText, { standard: formatGel(standardTotal) })}</p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm text-muted">{d.pro.compare.free}</span>
                <span className="font-semibold text-fg line-through decoration-danger/60">
                  <Money gel={standardTotal} />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#f5b544]/40 bg-[#f5b544]/10 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-fg">
                  <ProBadge /> {s.freeMods}×
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-success">
                  <Check className="size-4" strokeWidth={3} /> {d.common.free}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <Faq />
    </>
  );
}
