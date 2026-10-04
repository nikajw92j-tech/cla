"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

type Hit = { type: string; title: string; subtitle: string; href: string };

/** Dashboard-wide search (⌘K / Ctrl+K). Results are scoped server-side to what the user may see. */
export function DashboardSearch({ mode }: { mode: "customer" | "admin" }) {
  const { d } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?scope=${mode}&q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (res.ok) {
          setHits((await res.json()).hits);
          setActive(0);
        }
      } catch {}
      setLoading(false);
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, mode]);

  const go = (h: Hit) => {
    setQ("");
    setFocused(false);
    inputRef.current?.blur();
    router.push(h.href);
  };

  const show = focused && q.trim().length >= 2;

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length - 1));
          if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          if (e.key === "Enter" && hits[active]) go(hits[active]);
          if (e.key === "Escape") inputRef.current?.blur();
        }}
        placeholder={d.common.searchPlaceholder}
        aria-label={d.common.search}
        className="h-10 w-full rounded-xl border border-line bg-fg/[0.03] pr-14 pl-9 text-sm text-fg outline-none placeholder:text-muted focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">Ctrl K</kbd>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-card-solid shadow-soft"
          >
            {loading && !hits.length ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> {d.common.loading}
              </div>
            ) : hits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{d.common.noResults}</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {hits.map((h, i) => (
                  <li key={h.href + i}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(h)}
                      onMouseEnter={() => setActive(i)}
                      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === active && "bg-fg/[0.06]")}
                    >
                      <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand uppercase">{h.type}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-fg">{h.title}</span>
                        <span className="block truncate text-xs text-muted">{h.subtitle}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
