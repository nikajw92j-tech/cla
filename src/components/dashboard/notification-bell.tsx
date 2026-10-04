"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

export type NotificationItem = { id: string; kind: string; params: Record<string, string | number>; link: string | null; readAt: string | null; createdAt: string };

/** Renders a notification's text in the viewer's language, resolving "@i18n.key" params. */
export function useNotificationText() {
  const { t } = useApp();
  return (n: Pick<NotificationItem, "kind" | "params">) => {
    const p: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(n.params)) p[k] = typeof v === "string" && v.startsWith("@") ? t(v.slice(1)) : v;
    return t(`notif.${n.kind}`, p);
  };
}

const POLL_MS = 30_000;

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const { d, rel } = useApp();
  const text = useNotificationText();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const prevUnread = useRef(initialUnread);
  const [ring, setRing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number; items: NotificationItem[] };
      setItems(data.items);
      setUnread(data.unread);
      if (data.unread > prevUnread.current) {
        setRing(true);
        setTimeout(() => setRing(false), 1200);
        router.refresh(); // live status: pull fresh server data when something new happens
      }
      prevUnread.current = data.unread;
    } catch {}
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function markAll() {
    setUnread(0);
    prevUnread.current = 0;
    setItems((it) => it?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all: true }) });
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-lg text-fg-soft transition-colors hover:bg-fg/[0.06] hover:text-fg"
        aria-label={`${d.notifications.title}${unread ? ` (${unread})` : ""}`}
        aria-expanded={open}
      >
        <motion.span animate={ring ? { rotate: [0, -18, 16, -10, 8, 0] } : {}} transition={{ duration: 0.8 }}>
          <Bell className="size-[18px]" />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-bg"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-line bg-card-solid shadow-soft sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-fg">{d.notifications.title}</p>
                {unread > 0 && (
                  <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                    <CheckCheck className="size-3.5" /> {d.notifications.markAll}
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {items === null ? (
                  <div className="space-y-3 p-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-xl bg-fg/[0.05]" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-muted">{d.notifications.empty}</p>
                ) : (
                  items.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "/dashboard/notifications"}
                      onClick={() => setOpen(false)}
                      className={cn("flex gap-3 border-b border-line px-4 py-3 transition-colors last:border-0 hover:bg-fg/[0.03]", !n.readAt && "bg-brand/[0.04]")}
                    >
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand")} />
                      <span className="flex-1">
                        <span className="block text-sm text-fg">{text(n)}</span>
                        <span className="text-xs text-muted" suppressHydrationWarning>{rel(n.createdAt)}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-line py-2.5 text-center text-sm font-medium text-fg-soft hover:text-fg">
                {d.common.viewAll}
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
