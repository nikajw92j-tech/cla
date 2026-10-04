"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { SectionHeading, Reveal } from "@/components/site/motion";
import { ButtonLink } from "@/components/ui/button";

export function BeforeAfter() {
  const { d } = useApp();
  const s = d.home.beforeAfter;
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  }, []);

  return (
    <section className="py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
        <Reveal>
          <div
            ref={ref}
            className="relative mx-auto aspect-[4/5] max-w-5xl cursor-ew-resize touch-none overflow-hidden rounded-3xl border border-line-strong shadow-soft select-none sm:aspect-[16/9]"
            onPointerDown={(e) => {
              dragging.current = true;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              update(e.clientX);
            }}
            onPointerMove={(e) => dragging.current && update(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            {/* AFTER (full) */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b120c,#0e0a07)] p-6 text-[#f3e7da] sm:p-12">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold tracking-tight">kafe<span className="text-[#e3a55c]">.</span></span>
                <div className="hidden gap-6 text-xs text-[#f3e7da]/60 sm:flex">
                  <span>Menu</span>
                  <span>Story</span>
                  <span>Visit</span>
                </div>
                <span className="rounded-full bg-[#e3a55c] px-4 py-1.5 text-xs font-semibold text-[#1b120c]">{s.newCta}</span>
              </div>
              <div className="mt-[12%] grid items-center gap-8 sm:grid-cols-2">
                <div>
                  <p className="font-display text-3xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">{s.newTitle}</p>
                  <p className="mt-4 max-w-sm text-sm text-[#f3e7da]/65 sm:text-base">{s.newText}</p>
                  <span className="mt-6 inline-flex rounded-full bg-[#e3a55c] px-5 py-2.5 text-sm font-semibold text-[#1b120c]">{s.newCta} →</span>
                </div>
                <div className="relative hidden aspect-square sm:block">
                  <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle_at_35%_30%,#e3a55c,#6b3d1c_60%,#2b180c)] shadow-[0_40px_80px_-20px_#e3a55c80]" />
                  <div className="absolute inset-[30%] rounded-full border border-[#f3e7da]/20" />
                </div>
              </div>
              <span className="absolute right-4 bottom-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur">{s.after}</span>
            </div>

            {/* BEFORE (clipped) */}
            <div className="absolute inset-0 bg-[#e9e9e9] p-6 font-serif text-[#222] sm:p-12" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <div className="flex items-center justify-between border-b-4 border-double border-[#0033cc] pb-3">
                <span className="text-xl font-bold text-[#0033cc] underline">KAFE COFFEE SHOP</span>
                <span className="hidden text-xs text-[#0000ee] underline sm:block">Home | About | Contact | Links</span>
              </div>
              <div className="mt-8 max-w-xl">
                <p className="animate-pulse text-2xl font-bold text-[#cc0000] sm:text-4xl">{s.oldTitle}</p>
                <p className="mt-4 text-sm sm:text-base">{s.oldText}</p>
                <div className="mt-6 inline-block border-2 border-outset border-[#999] bg-[#ddd] px-4 py-1 text-sm">Click Here!!</div>
                <div className="mt-6 h-24 w-40 bg-[repeating-linear-gradient(45deg,#ccc,#ccc_8px,#bbb_8px,#bbb_16px)] sm:h-32 sm:w-56" />
                <p className="mt-4 text-xs text-[#666]">Best viewed in 800x600 · Visitors: 000127</p>
              </div>
              <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 font-sans text-xs font-semibold tracking-wide text-white">{s.before}</span>
            </div>

            {/* Handle */}
            <div className="absolute inset-y-0 z-10 w-0.5 bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.6)]" style={{ left: `${pos}%` }}>
              <motion.button
                type="button"
                role="slider"
                aria-label={s.drag}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pos)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setPos((p) => Math.max(2, p - 4));
                  if (e.key === "ArrowRight") setPos((p) => Math.min(98, p + 4));
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full border-2 border-white bg-black/40 text-white backdrop-blur-md active:cursor-grabbing"
              >
                <ChevronsLeftRight className="size-5" />
              </motion.button>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted">{s.drag}</p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/dashboard/orders/new?package=premium" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
              {s.cta}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
