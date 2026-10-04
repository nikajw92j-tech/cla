"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowRight, Code2, Crown, Download, LineChart, Palette, RefreshCcw, Rocket, Search, ShoppingBag, Wrench, ListChecks, MessageSquareText, Check } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, SectionHeading, SpotlightCard, Stagger, StaggerItem } from "@/components/site/motion";

/* ---------- Trust stats ---------- */
export function StatsBand({ stats }: { stats: { websites: number; customers: number; projects: number; responseHours: number } }) {
  const { d } = useApp();
  const items = [
    { v: stats.websites, s: "+", l: d.home.stats.websites },
    { v: stats.customers, s: "+", l: d.home.stats.customers },
    { v: stats.projects, s: "+", l: d.home.stats.projects },
    { v: stats.responseHours, s: d.home.stats.hours, l: d.home.stats.response, prefix: "<" },
  ];
  return (
    <section aria-label={d.home.stats.title} className="relative py-10">
      <div className="container-x">
        <Reveal className="glass grid grid-cols-2 overflow-hidden rounded-3xl lg:grid-cols-4">
          {items.map((it, i) => (
            <div key={it.l} className={`relative px-6 py-8 text-center sm:py-10 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
              <p className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl">
                {it.prefix}
                <CountUp to={it.v} suffix={it.s} />
              </p>
              <p className="mt-2 text-sm text-muted">{it.l}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Promo video ---------- */
const PROMO_VIDEOS = [
  { key: "tabOverview", file: "nexora-promo" },
  { key: "tabPlatform", file: "nexora-promo-2" },
] as const;

export function PromoVideo() {
  const { d } = useApp();
  const s = d.home.promo;
  const [active, setActive] = useState(0);
  const v = PROMO_VIDEOS[active];
  return (
    <section id="video" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
        <div role="tablist" className="mx-auto mb-6 flex w-fit flex-wrap justify-center gap-2">
          {PROMO_VIDEOS.map((it, i) => (
            <button
              key={it.file}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold transition-colors",
                i === active ? "border-brand/50 bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong",
              )}
            >
              {s[it.key]}
            </button>
          ))}
        </div>
        <Reveal className="glass mx-auto max-w-5xl overflow-hidden rounded-3xl p-2 sm:p-3">
          <video
            key={v.file}
            className="aspect-video w-full rounded-2xl bg-black"
            src={`/video/${v.file}.mp4`}
            poster={`/video/${v.file}-poster.jpg`}
            controls
            playsInline
            preload="metadata"
          />
        </Reveal>
        <div className="mt-8 flex justify-center">
          <ButtonLink href={`/video/${v.file}.mp4`} download={`${v.file}.mp4`} prefetch={false} variant="secondary" iconRight={<Download className="size-4" />}>
            {s.download}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ---------- Services ---------- */
const SERVICE_ICONS = [Palette, Code2, ShoppingBag, Search, Wrench, RefreshCcw];

export function Services() {
  const { d } = useApp();
  const s = d.home.services;
  return (
    <section id="services" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((it, i) => {
            const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
            return (
              <StaggerItem key={it.title}>
                <SpotlightCard className="h-full rounded-3xl">
                  <div className="glass relative h-full overflow-hidden rounded-3xl p-7">
                    <div className="mb-6 grid size-12 place-items-center rounded-2xl border border-line bg-gradient-to-br from-brand/20 to-brand-2/10 text-brand transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]">
                      <Icon className="size-[22px]" />
                    </div>
                    <h3 className="text-lg font-semibold text-fg">{it.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{it.desc}</p>
                    <span className="absolute top-6 right-6 font-display text-sm text-fg/15">0{i + 1}</span>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
const HOW_ICONS = [ListChecks, MessageSquareText, Code2, Rocket];

export function HowItWorks() {
  const { d } = useApp();
  const s = d.home.how;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  return (
    <section id="how" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
        <div ref={ref} className="relative">
          {/* Connector lines (horizontal on desktop, vertical on mobile) */}
          <div className="absolute top-8 right-[12.5%] left-[12.5%] hidden h-px bg-line lg:block" aria-hidden>
            <motion.div className="h-full origin-left bg-gradient-to-r from-brand via-brand-2 to-brand-3" style={{ scaleX: progress }} />
          </div>
          <div className="absolute top-8 bottom-8 left-8 w-px bg-line lg:hidden" aria-hidden>
            <motion.div className="w-full origin-top bg-gradient-to-b from-brand via-brand-2 to-brand-3" style={{ scaleY: progress, height: "100%" }} />
          </div>
          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {s.steps.map((step, i) => {
              const Icon = HOW_ICONS[i];
              return (
                <Reveal as="li" key={step.title} delay={i * 0.12} className="relative flex gap-5 lg:flex-col lg:items-center lg:text-center">
                  <div className="relative z-10 shrink-0">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-brand opacity-40 blur-xl" />
                    <div className="relative grid size-16 place-items-center rounded-2xl border border-line-strong bg-card-solid text-brand shadow-soft">
                      <Icon className="size-6" />
                      <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-gradient-brand text-[11px] font-bold text-white">{i + 1}</span>
                    </div>
                  </div>
                  <div className="pt-2 lg:pt-4">
                    <h3 className="text-lg font-semibold text-fg">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted lg:mx-auto lg:max-w-[16rem]">{step.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing cards ---------- */
export type PackageCard = { id: string; slug: string; priceGel: number; isPopular: boolean; deliveryDays: number; name: string; tagline: string; features: string[] };

export function PricingCards({ packages }: { packages: PackageCard[] }) {
  const { d, money, fmt, currency } = useApp();
  return (
    <div>
      <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
        {packages.map((p, i) => {
          const popular = p.isPopular;
          const ultimate = p.slug === "ultimate";
          const prev = packages[i - 1];
          const cta = d.pricing.cta[p.slug as keyof typeof d.pricing.cta] ?? d.nav.getStarted;
          return (
            <Reveal key={p.id} delay={i * 0.1} className={popular ? "lg:-my-4" : ""}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-7 sm:p-8 ${
                  popular
                    ? "border-gradient shadow-[0_30px_80px_-30px_var(--brand)]"
                    : ultimate
                      ? "border border-[#f5b544]/30 bg-[linear-gradient(160deg,color-mix(in_oklab,#f5b544_10%,var(--card-solid)),var(--card-solid)_50%)] shadow-soft"
                      : "glass shadow-soft"
                }`}
              >
                {popular && (
                  <>
                    <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-brand/30 blur-3xl" />
                    <span className="absolute top-6 right-6 rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-bold tracking-wider text-white">{d.pricing.mostPopular}</span>
                  </>
                )}
                {ultimate && (
                  <span className="absolute top-6 right-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#f7cf73] to-[#e08a2c] px-3 py-1 text-[11px] font-bold tracking-wider text-[#1b1203]">
                    <Crown className="size-3" /> {d.pricing.fullService}
                  </span>
                )}
                <h3 className="relative pr-28 font-display text-xl font-semibold text-fg">{p.name}</h3>
                <p className="relative mt-2 min-h-[2.5rem] text-sm text-muted">{p.tagline}</p>
                <div className="relative mt-6 flex items-end gap-2">
                  <motion.span key={currency} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl font-semibold tracking-tight text-fg">
                    {money(p.priceGel, { approx: false })}
                  </motion.span>
                  <span className="pb-2 text-sm text-muted">{d.pricing.oneTime}</span>
                </div>
                <p className="relative mt-2 text-xs text-muted">{fmt(d.pricing.delivery, { days: p.deliveryDays })}</p>
                <ButtonLink
                  href={`/dashboard/orders/new?package=${p.slug}`}
                  variant={popular ? "primary" : ultimate ? "gold" : "secondary"}
                  size="lg"
                  className="relative mt-7 w-full"
                  iconRight={<ArrowRight className="size-4" />}
                >
                  {cta}
                </ButtonLink>
                <div className="relative my-7 h-px bg-line" />
                {prev && <p className="relative mb-4 text-sm font-medium text-fg">{fmt(d.pricing.everythingIn, { name: prev.name })}</p>}
                <ul className="relative space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-fg-soft">
                      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${ultimate ? "bg-[#f5b544]/15 text-[#e0a030]" : "bg-brand/15 text-brand"}`}>
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </Reveal>
          );
        })}
      </div>
      {currency !== "GEL" && <p className="mt-8 text-center text-xs text-muted">{d.common.approxNote}</p>}
    </div>
  );
}

export function PricingSection({ packages }: { packages: PackageCard[] }) {
  const { d } = useApp();
  return (
    <section id="pricing" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-96 bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--brand)_10%,transparent),transparent)]" />
      <div className="container-x relative">
        <SectionHeading eyebrow={d.home.pricing.eyebrow} title={d.home.pricing.title} subtitle={d.home.pricing.subtitle} />
        <PricingCards packages={packages} />
      </div>
    </section>
  );
}

/* ---------- Pro teaser ---------- */
export function ProTeaser({ priceGel }: { priceGel: number }) {
  const { d, money, fmt } = useApp();
  const s = d.home.proTeaser;
  return (
    <section className="py-16">
      <div className="container-x">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[2rem] border border-[#f5b544]/25 bg-[linear-gradient(135deg,#1a1408,#0d0b07_55%,#16120a)] p-8 text-white sm:p-12 lg:p-16">
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[#f5b544]/25 blur-3xl" />
            <div className="absolute -bottom-32 left-10 size-80 rounded-full bg-brand/20 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#f5b544]/30 bg-[#f5b544]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#f7cf73] uppercase">
                  <Crown className="size-3.5" /> {s.eyebrow}
                </span>
                <h2 className="mt-5 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">{s.title}</h2>
                <p className="mt-4 max-w-lg text-lg text-white/70">{s.subtitle}</p>
                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <ButtonLink href="/pro" variant="gold" size="lg" iconRight={<ArrowRight className="size-4" />}>
                    {s.button}
                  </ButtonLink>
                  <span className="text-sm text-white/60">{fmt(d.pro.price, { price: money(priceGel) })}</span>
                </div>
              </div>
              <div className="relative grid gap-3">
                {d.pro.perks.slice(0, 4).map((p, i) => (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.6 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f5b544]/15 text-[#f7cf73]">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium">{p.title}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Estimate CTA + final CTA ---------- */
export function EstimateCta() {
  const { d } = useApp();
  const s = d.home.estimateCta;
  return (
    <section className="py-16">
      <div className="container-x">
        <Reveal className="glass flex flex-col items-start justify-between gap-6 rounded-3xl p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="flex items-start gap-5">
            <div className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white sm:grid">
              <LineChart className="size-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">{s.title}</h2>
              <p className="mt-1.5 text-muted">{s.subtitle}</p>
            </div>
          </div>
          <ButtonLink href="/estimate" size="lg" iconRight={<ArrowRight className="size-4" />} className="w-full sm:w-auto">
            {s.button}
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { d } = useApp();
  const s = d.home.finalCta;
  return (
    <section className="py-24">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-[#5b6cff] to-brand-2 px-8 py-16 text-center text-white sm:px-16 sm:py-24">
            <div className="bg-grid absolute inset-0 opacity-30 [--grid:rgba(255,255,255,0.12)]" />
            <motion.div className="absolute -top-20 -left-20 size-72 rounded-full bg-white/20 blur-3xl" animate={{ x: [0, 40, 0] }} transition={{ duration: 10, repeat: Infinity }} />
            <h2 className="relative mx-auto max-w-3xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">{s.title}</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-lg text-white/80">{s.subtitle}</p>
            <ButtonLink href="/register" size="lg" variant="secondary" className="relative mt-10 !border-white/30 !bg-white !text-[#1a1640]" iconRight={<ArrowRight className="size-4" />}>
              {s.button}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
