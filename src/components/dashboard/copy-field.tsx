"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

export function CopyField({ value, mono, large }: { value: string; mono?: boolean; large?: boolean }) {
  const { d } = useApp();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-fg/[0.03] p-1.5 pl-4">
      <span className={cn("min-w-0 flex-1 truncate text-fg", mono && "font-mono tracking-wider", large ? "text-xl font-semibold" : "text-sm")}>{value}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {}
        }}
        className="relative flex h-9 items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-brand px-3 text-sm font-medium text-white active:scale-95"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(copied)} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="flex items-center gap-1.5">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? d.common.copied : d.common.copy}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
