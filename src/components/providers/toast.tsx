"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++seq;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? AlertTriangle : Info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                role={t.kind === "error" ? "alert" : "status"}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-4 shadow-soft"
              >
                <Icon
                  className={
                    t.kind === "success" ? "mt-0.5 size-5 shrink-0 text-success" : t.kind === "error" ? "mt-0.5 size-5 shrink-0 text-danger" : "mt-0.5 size-5 shrink-0 text-brand"
                  }
                />
                <p className="flex-1 text-sm leading-relaxed text-fg">{t.text}</p>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="Close">
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
