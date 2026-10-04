"use client";

import { useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Gauge, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { ButtonLink } from "@/components/ui/button";
import { Aurora, TextReveal } from "@/components/site/motion";

export function Hero() {
  const { d } = useApp();
  const h = d.home.hero;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yText = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-28 pb-20 sm:pt-36 lg:pt-40 lg:pb-28">
      <Aurora />
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <motion.div style={{ y: yText, opacity }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-fg-soft backdrop-blur"
          >
            <Sparkles className="size-3.5 text-brand" />
            {h.eyebrow}
          </motion.span>
          <h1 className="font-display text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.03em] text-fg sm:text-6xl lg:text-[4.4rem]">
            <TextReveal text={h.line1} className="block" />
            <TextReveal text={h.line2} className="block" delay={0.15} />
            <TextReveal text={h.line3} className="block" delay={0.3} gradient />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted sm:text-xl"
          >
            {h.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <ButtonLink href="/dashboard/orders/new" size="lg" iconRight={<ArrowRight className="size-[18px]" />}>
              {h.primary}
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="secondary">
              {h.secondary}
            </ButtonLink>
          </motion.div>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-soft"
          >
            {[h.point1, h.point2, h.point3].map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </motion.ul>
        </motion.div>
        <BrowserMockup />
      </div>
    </section>
  );
}

function BrowserMockup() {
  const { d } = useApp();
  const h = d.home.hero;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 });
  const fx = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), { stiffness: 80, damping: 20 });
  const fy = useSpring(useTransform(my, [-0.5, 0.5], [-14, 14]), { stiffness: 80, damping: 20 });

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[600px] [perspective:1400px]"
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      aria-hidden
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative">
        <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/40 via-brand-2/25 to-brand-3/30 opacity-70 blur-3xl" />
        {/* Browser window */}
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-card-solid shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-3 border-b border-line bg-fg/[0.03] px-4 py-3">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 truncate rounded-md bg-fg/[0.05] px-3 py-1 text-center text-[11px] text-muted">🔒 {h.mockUrl}</div>
          </div>
          <div className="relative h-[330px] overflow-hidden bg-[linear-gradient(160deg,#141530,#0b0c18_60%)] p-6 sm:h-[380px]">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded-full bg-white/80" />
              <div className="hidden gap-4 sm:flex">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-2 w-10 rounded-full bg-white/25" />
                ))}
              </div>
              <div className="h-6 w-16 rounded-md bg-gradient-brand" />
            </div>
            <motion.div className="mt-10 max-w-[70%]" initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } } }}>
              <motion.p variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }} className="font-display text-2xl leading-tight font-semibold text-white sm:text-3xl">
                {h.mockHeadline}
              </motion.p>
              <motion.div variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }} className="mt-4 space-y-2">
                <div className="h-2 w-full rounded-full bg-white/20" />
                <div className="h-2 w-4/5 rounded-full bg-white/20" />
              </motion.div>
              <motion.div variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }} className="mt-6 flex gap-2">
                <span className="rounded-lg bg-gradient-brand px-4 py-2 text-xs font-semibold text-white">{h.mockCta}</span>
                <span className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white/80">→</span>
              </motion.div>
            </motion.div>
            <div className="absolute right-6 bottom-6 left-6 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + i * 0.12, duration: 0.6 }}
                  className="h-20 rounded-xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="size-5 rounded-md bg-gradient-to-br from-brand to-brand-2 opacity-80" />
                  <div className="mt-3 h-1.5 w-3/4 rounded-full bg-white/25" />
                  <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-white/15" />
                </motion.div>
              ))}
            </div>
            <div className="absolute top-16 -right-10 size-48 rounded-full bg-brand/40 blur-3xl" />
          </div>
        </div>

        {/* Floating stat cards */}
        <motion.div style={{ x: fx, y: fy, translateZ: 60 }} className="absolute -bottom-6 -left-4 sm:-left-10">
          <div className="glass animate-float flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft">
            <span className="grid size-9 place-items-center rounded-xl bg-success/15 text-success">
              <TrendingUp className="size-[18px]" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{h.mockVisitors}</p>
              <p className="text-sm font-semibold text-fg">+248%</p>
            </div>
          </div>
        </motion.div>
        <motion.div style={{ x: fx, y: fy, translateZ: 80 }} className="absolute -top-6 -right-3 sm:-right-8">
          <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft [animation:float_7s_ease-in-out_infinite_1s]">
            <span className="grid size-9 place-items-center rounded-xl bg-brand/15 text-brand">
              <Gauge className="size-[18px]" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{h.mockSpeed}</p>
              <p className="text-sm font-semibold text-fg">98 / 100</p>
            </div>
          </div>
        </motion.div>
        <motion.div style={{ translateZ: 40 }} className="absolute top-1/2 -right-4 hidden sm:block">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#f7cf73] to-[#e08a2c] text-[#1b1203] shadow-[0_10px_30px_-8px_#f5b544] [animation:float_5s_ease-in-out_infinite_.5s]">
            <Zap className="size-5" />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
