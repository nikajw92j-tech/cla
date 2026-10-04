"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-providers";

/* ---------- Card ---------- */
export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl shadow-soft",
        hover && "transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-line-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }: { title: ReactNode; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h3 className="font-semibold text-fg">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badges ---------- */
const TONES = {
  gray: "bg-fg/[0.06] text-fg-soft border-fg/10",
  blue: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  red: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ children, tone = "gray", className, dot }: { children: ReactNode; tone?: Tone; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  DRAFT: "gray",
  PENDING_PAYMENT: "amber",
  PAID: "teal",
  SUBMITTED: "blue",
  REVIEWING: "violet",
  APPROVED: "teal",
  IN_PROGRESS: "amber",
  WAITING_CUSTOMER: "pink",
  COMPLETED: "green",
  CANCELLED: "gray",
  IN_DEVELOPMENT: "amber",
  LIVE: "green",
  MAINTENANCE: "violet",
  PAUSED: "gray",
  OPEN: "blue",
  ANSWERED: "green",
  AWAITING_STAFF: "amber",
  RESOLVED: "teal",
  CLOSED: "gray",
  PENDING: "amber",
  SUCCEEDED: "green",
  FAILED: "red",
  REFUNDED: "gray",
  ACTIVE: "green",
  EXPIRED: "gray",
  STARTED: "blue",
  DESIGN: "violet",
  DEVELOPMENT: "amber",
  TESTING: "pink",
  REVIEW: "teal",
};

export function StatusBadge({
  kind,
  value,
}: {
  kind: "order" | "request" | "stage" | "website" | "ticket" | "payment" | "pro";
  value: string;
}) {
  const { t } = useApp();
  const live = value === "IN_PROGRESS" || value === "IN_DEVELOPMENT";
  return (
    <Badge tone={STATUS_TONE[value] ?? "gray"}>
      <span className="relative flex size-1.5">
        {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
      {t(`status.${kind}.${value}`)}
    </Badge>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-gradient-to-br from-[#f7cf73] to-[#e08a2c] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#1b1203]",
        className,
      )}
    >
      PRO
    </span>
  );
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, className, tone = "brand", label }: { value: number; className?: string; tone?: "brand" | "gold"; label?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      ref={ref}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-fg/[0.07]", className)}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={cn(
          "relative h-full overflow-hidden rounded-full",
          tone === "gold" ? "bg-gradient-to-r from-[#f7cf73] to-[#e08a2c]" : "bg-gradient-to-r from-brand via-brand-2 to-brand",
        )}
        initial={{ width: 0 }}
        animate={{ width: inView ? `${v}%` : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/35 to-transparent" style={{ transform: "translateX(-100%)" }} />
      </motion.div>
    </div>
  );
}

export function ProgressRing({ value, size = 120, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring-${size}-${stroke}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--brand-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} className="text-fg/[0.07]" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * Math.max(0, Math.min(100, value))) / 100 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ---------- Counter ---------- */
export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1800, bounce: 0 });
  const text = useTransform(spring, (v) => `${Math.round(v).toLocaleString("en-US")}${suffix}`);
  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);
  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}

/* ---------- Skeleton / Empty ---------- */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-fg/[0.06]", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.06] to-transparent" />
    </div>
  );
}

export function EmptyState({ icon, title, action, text }: { icon: ReactNode; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-3xl bg-gradient-brand opacity-25 blur-2xl" />
        <div className="relative grid size-16 place-items-center rounded-2xl border border-line bg-card-solid text-brand shadow-soft [&_svg]:size-7">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ src, name, size = 36, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover ring-2 ring-line", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-brand font-semibold text-white ring-2 ring-line", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const { d } = useApp();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn("relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-card-solid shadow-soft sm:rounded-3xl", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card-solid/90 px-6 py-4 backdrop-blur">
              <h2 className="font-semibold text-fg">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-fg/5 hover:text-fg" aria-label={d.common.close}>
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.div>
  );
}

/* ---------- Money ---------- */
export function Money({ gel, className, approx }: { gel: number; className?: string; approx?: boolean }) {
  const { money } = useApp();
  return <span className={className}>{money(gel, { approx })}</span>;
}

export function FormattedDate({ value, opts, relative }: { value: Date | string; opts?: Intl.DateTimeFormatOptions; relative?: boolean }) {
  const { date, rel } = useApp();
  return (
    <time dateTime={new Date(value).toISOString()} suppressHydrationWarning>
      {relative ? rel(value) : date(value, opts)}
    </time>
  );
}

/**
 * Renders a translated string by key — lets server components output client-localized text.
 * String params starting with "@" are themselves i18n keys (e.g. "@status.request.IN_PROGRESS").
 */
export function T({ k, params }: { k: string; params?: Record<string, string | number> }) {
  const { t } = useApp();
  const resolved: Record<string, string | number> = {};
  for (const [key, v] of Object.entries(params ?? {})) resolved[key] = typeof v === "string" && v.startsWith("@") ? t(v.slice(1)) : v;
  return <>{t(k, resolved)}</>;
}
