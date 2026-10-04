"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { SpotlightCard } from "@/components/site/motion";
import { cn } from "@/lib/utils";

export type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  technologies: string;
  desktopImage: string | null;
  mobileImage: string | null;
  liveUrl: string | null;
  accent: string;
};

/** Generated website screenshot used when no image is uploaded — tinted by the project's accent color. */
function GeneratedScreen({ accent, variant, mobile, title }: { accent: string; variant: number; mobile?: boolean; title: string }) {
  const dark = variant % 2 === 0;
  return (
    <div className={cn("flex min-h-[200%] flex-col gap-3 p-3", dark ? "bg-[#0f1016]" : "bg-[#f6f5f2]")}>
      <div className="flex items-center justify-between">
        <span className={cn("text-[9px] font-bold tracking-tight", dark ? "text-white" : "text-[#111]")}>{title.split(" ")[0]}</span>
        {!mobile && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-1 w-5 rounded-full", dark ? "bg-white/25" : "bg-black/15")} />
            ))}
          </div>
        )}
        <span className="h-3 w-8 rounded" style={{ background: accent }} />
      </div>
      <div className={cn("grid gap-3", !mobile && variant % 3 !== 1 && "grid-cols-2 items-center")}>
        <div className="space-y-1.5 py-3">
          <div className={cn("h-2.5 w-11/12 rounded", dark ? "bg-white/85" : "bg-[#111]/85")} />
          <div className={cn("h-2.5 w-2/3 rounded", dark ? "bg-white/85" : "bg-[#111]/85")} />
          <div className={cn("mt-2 h-1 w-full rounded", dark ? "bg-white/20" : "bg-black/15")} />
          <div className={cn("h-1 w-4/5 rounded", dark ? "bg-white/20" : "bg-black/15")} />
          <div className="mt-2 h-3.5 w-14 rounded" style={{ background: accent }} />
        </div>
        <div className="aspect-[4/3] rounded-lg" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}33)` }} />
      </div>
      <div className={cn("grid gap-2", mobile ? "grid-cols-1" : "grid-cols-3")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("rounded-lg p-2", dark ? "bg-white/[0.05]" : "bg-black/[0.04]")}>
            <div className="aspect-video rounded" style={{ background: `${accent}${i === 1 ? "aa" : "55"}` }} />
            <div className={cn("mt-1.5 h-1 w-3/4 rounded", dark ? "bg-white/30" : "bg-black/20")} />
          </div>
        ))}
      </div>
      <div className="rounded-lg p-3" style={{ background: `${accent}22` }}>
        <div className={cn("mx-auto h-2 w-1/2 rounded", dark ? "bg-white/70" : "bg-black/70")} />
        <div className="mx-auto mt-2 h-3 w-16 rounded" style={{ background: accent }} />
      </div>
      <div className={cn("grid gap-2", mobile ? "grid-cols-2" : "grid-cols-4")}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("aspect-square rounded-lg", dark ? "bg-white/[0.06]" : "bg-black/[0.05]")} />
        ))}
      </div>
    </div>
  );
}

function Screen({ src, alt, ...g }: { src: string | null; alt: string; accent: string; variant: number; mobile?: boolean; title: string }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" decoding="async" className="w-full object-cover object-top" />;
  return <GeneratedScreen {...g} />;
}

export function PortfolioCard({ p, index }: { p: PortfolioItem; index: number }) {
  const { d } = useApp();
  const techs = p.technologies.split(",").map((t) => t.trim()).filter(Boolean);
  return (
    <SpotlightCard className="h-full rounded-3xl" glow={p.accent}>
      <article className="glass flex h-full flex-col overflow-hidden rounded-3xl">
        <div className="relative h-64 overflow-hidden sm:h-72" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${p.accent}33, transparent 70%)` }}>
          {/* Desktop frame */}
          <div className="absolute top-8 left-6 w-[78%] overflow-hidden rounded-xl border border-line-strong bg-card-solid shadow-2xl transition-transform duration-700 ease-out [transform:perspective(1200px)_rotateY(8deg)_rotateX(4deg)] group-hover:[transform:perspective(1200px)_rotateY(0deg)_rotateX(0deg)_translateY(-6px)]">
            <div className="flex items-center gap-1 border-b border-line bg-fg/[0.03] px-2.5 py-1.5">
              <span className="size-1.5 rounded-full bg-[#ff5f57]" />
              <span className="size-1.5 rounded-full bg-[#febc2e]" />
              <span className="size-1.5 rounded-full bg-[#28c840]" />
              <span className="sr-only">{d.home.portfolio.desktop}</span>
            </div>
            <div className="h-44 overflow-hidden sm:h-52">
              <div className="transition-transform duration-[2500ms] ease-in-out group-hover:-translate-y-1/2">
                <Screen src={p.desktopImage} alt={`${p.title} — ${d.home.portfolio.desktop}`} accent={p.accent} variant={index} title={p.title} />
              </div>
            </div>
          </div>
          {/* Mobile frame */}
          <div className="absolute right-5 bottom-[-30px] w-[26%] overflow-hidden rounded-[18px] border-[3px] border-[#1d1f2a] bg-card-solid shadow-2xl transition-transform duration-700 ease-out group-hover:-translate-y-8 group-hover:rotate-[-3deg]">
            <div className="mx-auto mt-1 h-1 w-8 rounded-full bg-[#1d1f2a]" />
            <div className="h-48 overflow-hidden">
              <div className="transition-transform delay-150 duration-[2500ms] ease-in-out group-hover:-translate-y-1/3">
                <Screen src={p.mobileImage} alt={`${p.title} — ${d.home.portfolio.mobile}`} accent={p.accent} variant={index + 1} mobile title={p.title} />
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col border-t border-line p-6">
          <span className="text-xs font-medium tracking-wide uppercase" style={{ color: p.accent }}>
            {p.category}
          </span>
          <h3 className="mt-1.5 text-xl font-semibold text-fg">{p.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {techs.map((t) => (
              <span key={t} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-fg-soft">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-auto pt-5">
            {p.liveUrl ? (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg transition-colors hover:text-brand"
              >
                {d.home.portfolio.viewProject}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-soft">{d.home.portfolio.viewProject}</span>
            )}
          </div>
        </div>
      </article>
    </SpotlightCard>
  );
}

export function PortfolioGrid({ items, filterable }: { items: PortfolioItem[]; filterable?: boolean }) {
  const { d } = useApp();
  const cats = [...new Set(items.map((i) => i.category))];
  const [cat, setCat] = useState<string | null>(null);
  const shown = cat ? items.filter((i) => i.category === cat) : items;
  if (!items.length) return <p className="py-10 text-center text-muted">{d.home.portfolio.empty}</p>;
  return (
    <>
      {filterable && cats.length > 1 && (
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {[null, ...cats].map((c) => (
            <button
              key={c ?? "all"}
              onClick={() => setCat(c)}
              className={cn("relative rounded-full px-4 py-2 text-sm font-medium transition-colors", cat === c ? "text-white" : "text-fg-soft hover:text-fg")}
            >
              {cat === c && <motion.span layoutId="pf-filter" className="absolute inset-0 -z-0 rounded-full bg-gradient-brand" />}
              <span className="relative">{c ?? d.common.all}</span>
            </button>
          ))}
        </div>
      )}
      <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <PortfolioCard p={p} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
