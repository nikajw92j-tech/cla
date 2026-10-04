"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades/slides children in when scrolled into view. */
export function Reveal({ children, delay = 0, y = 24, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </Comp>
  );
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Word-by-word text reveal for headlines. */
export function TextReveal({ text, className, delay = 0, gradient }: { text: string; className?: string; delay?: number; gradient?: boolean }) {
  const words = text.split(" ");
  return (
    <span className={cn("inline-block", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className={cn("inline-block", gradient && "text-gradient animate-gradient")}
            initial={{ y: "110%", rotate: 4 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.07, ease }}
          >
            {w}
            {i < words.length - 1 && " "}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Section heading block used across the marketing site. */
export function SectionHeading({ eyebrow, title, subtitle, center = true, className }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean; className?: string }) {
  return (
    <Reveal className={cn("mb-12 max-w-2xl sm:mb-16", center && "mx-auto text-center", className)}>
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium tracking-wide text-fg-soft uppercase">
          <span className="size-1.5 rounded-full bg-gradient-brand" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-fg sm:text-4xl lg:text-[2.75rem]">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-pretty text-muted sm:text-lg">{subtitle}</p>}
    </Reveal>
  );
}

/** Card with a cursor-following spotlight and subtle 3D tilt. */
export function SpotlightCard({ children, className, tilt = true, glow = "var(--brand)" }: { children: ReactNode; className?: string; tilt?: boolean; glow?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const bg = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, color-mix(in oklab, ${glow} 16%, transparent), transparent 70%)`;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = ref.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    mx.set(x);
    my.set(y);
    if (tilt) {
      ry.set(((x / r.width) - 0.5) * 6);
      rx.set(-((y / r.height) - 0.5) * 6);
    }
  }
  function onLeave() {
    mx.set(-200);
    my.set(-200);
    rx.set(0);
    ry.set(0);
  }
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className={cn("group relative", className)}
    >
      <motion.div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: bg }} />
      {children}
    </motion.div>
  );
}

/** Parallax wrapper — moves children slower/faster than scroll. */
export function Parallax({ children, offset = 60, className }: { children: ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Large blurred gradient orbs that drift in the background. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_40%,transparent),transparent)] blur-2xl" />
      <motion.div
        className="absolute top-20 -left-40 size-[420px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-2)_28%,transparent),transparent)] blur-2xl"
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 -right-40 size-[460px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand-3)_22%,transparent),transparent)] blur-2xl"
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/** Thin scroll progress bar at the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand via-brand-2 to-brand-3" style={{ scaleX }} />;
}

/** Page enter transition. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
      {children}
    </motion.div>
  );
}
