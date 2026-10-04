"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, Paperclip, UploadCloud, X, Circle, Loader } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { ProgressBar } from "@/components/ui/misc";
import { STAGES } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/* ---------- Stat card ---------- */
export function StatCard({ label, value, icon, hint, href, accent = "brand", children, index = 0 }: { label: string; value: ReactNode; icon: ReactNode; hint?: ReactNode; href?: string; accent?: "brand" | "gold" | "green" | "pink"; children?: ReactNode; index?: number }) {
  const tone = {
    brand: "from-brand/20 to-brand-2/10 text-brand",
    gold: "from-[#f5b544]/25 to-[#f5b544]/5 text-[#d99a2b] dark:text-[#f7cf73]",
    green: "from-success/20 to-success/5 text-success",
    pink: "from-brand-3/20 to-brand-3/5 text-brand-3",
  }[accent];
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="glass group h-full rounded-2xl p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl bg-gradient-to-br [&_svg]:size-[18px]", tone)}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {children}
    </motion.div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ---------- Project stage tracker ---------- */
export function StageTracker({ stage, progress, eta, compact }: { stage: string; progress: number; eta?: string | Date | null; compact?: boolean }) {
  const { d, fmt, date } = useApp();
  const idx = STAGES.findIndex((s) => s.code === stage);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">{d.websites.stage}</p>
          <p className="text-lg font-semibold text-fg">{d.status.stage[stage as keyof typeof d.status.stage]}</p>
        </div>
        <p className="font-display text-3xl font-semibold text-gradient">{progress}%</p>
      </div>
      <ProgressBar value={progress} className="mt-4 h-3" label={d.dash.projectProgress} />
      {eta && progress < 100 && <p className="mt-2 text-xs text-muted">{fmt(d.dash.estimated, { date: date(eta) })}</p>}
      {!compact && (
        <ol className="mt-6 grid grid-cols-3 gap-y-4 sm:grid-cols-6">
          {STAGES.map((s, i) => {
            const done = i < idx || stage === "COMPLETED";
            const current = i === idx && stage !== "COMPLETED";
            return (
              <li key={s.code} className="relative flex flex-col items-center text-center">
                {i > 0 && <span className={cn("absolute top-3.5 right-1/2 -z-0 hidden h-0.5 w-full sm:block", i <= idx ? "bg-gradient-to-r from-brand to-brand-2" : "bg-line")} />}
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "relative z-10 grid size-7 place-items-center rounded-full border-2 text-[10px] font-bold",
                    done ? "border-transparent bg-gradient-brand text-white" : current ? "border-brand bg-card-solid text-brand" : "border-line bg-card-solid text-muted",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : current ? <span className="size-2 animate-pulse rounded-full bg-brand" /> : null}
                </motion.span>
                <span className={cn("mt-2 text-[11px] leading-tight", done || current ? "text-fg" : "text-muted")}>{d.status.stage[s.code]}</span>
                <span className="text-[10px] text-muted">{s.progress}%</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ---------- Request timeline ---------- */
const TIMELINE: { key: "submitted" | "reviewing" | "started" | "completed" | "confirmed"; reached: string[] }[] = [
  { key: "submitted", reached: ["SUBMITTED", "REVIEWING", "APPROVED", "IN_PROGRESS", "WAITING_CUSTOMER", "COMPLETED"] },
  { key: "reviewing", reached: ["REVIEWING", "APPROVED", "IN_PROGRESS", "WAITING_CUSTOMER", "COMPLETED"] },
  { key: "started", reached: ["IN_PROGRESS", "WAITING_CUSTOMER", "COMPLETED"] },
  { key: "completed", reached: ["WAITING_CUSTOMER", "COMPLETED"] },
  { key: "confirmed", reached: ["COMPLETED"] },
];

export function RequestTimeline({ status, events }: { status: string; events: { status: string; createdAt: string | Date; note?: string | null }[] }) {
  const { d, date } = useApp();
  const firstAt = (codes: string[]) => events.find((e) => codes.includes(e.status))?.createdAt;
  const cancelled = status === "CANCELLED";
  return (
    <ol className="relative space-y-0">
      {TIMELINE.map((step, i) => {
        const reached = step.reached.includes(status);
        const nextReached = TIMELINE[i + 1]?.reached.includes(status);
        const current = reached && !nextReached && status !== "COMPLETED";
        const at = firstAt(step.reached);
        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {i < TIMELINE.length - 1 && (
              <span className="absolute top-8 bottom-0 left-[15px] w-0.5 overflow-hidden bg-line">
                <motion.span className="block w-full bg-gradient-to-b from-brand to-brand-2" initial={{ height: 0 }} animate={{ height: nextReached ? "100%" : 0 }} transition={{ duration: 0.6, delay: i * 0.15 }} />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.12 }}
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2",
                reached && !current ? "border-transparent bg-gradient-brand text-white" : current ? "border-brand bg-card-solid text-brand" : "border-line bg-card-solid text-muted",
              )}
            >
              {reached && !current ? <Check className="size-4" strokeWidth={3} /> : current ? <Loader className="size-4 animate-spin [animation-duration:3s]" /> : <Circle className="size-2.5" />}
              {current && <span className="absolute inset-0 animate-[pulse-ring_1.8s_ease-out_infinite] rounded-full border-2 border-brand" />}
            </motion.span>
            <div className="pt-1">
              <p className={cn("text-sm font-medium", reached ? "text-fg" : "text-muted")}>{d.requests.timeline[step.key]}</p>
              {at && reached && <p className="text-xs text-muted">{date(at, { dateStyle: "medium", timeStyle: "short" })}</p>}
            </div>
          </li>
        );
      })}
      {cancelled && <li className="mt-4 rounded-xl border border-line bg-fg/[0.03] px-4 py-3 text-sm text-muted">{d.status.request.CANCELLED}</li>}
    </ol>
  );
}

/* ---------- File drop ---------- */
export function FileDrop({ name = "files", max = 8, accept, imagesOnly }: { name?: string; max?: number; accept?: string; imagesOnly?: boolean }) {
  const { d, fmt } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);

  const sync = (list: File[]) => {
    const next = list.slice(0, max);
    setFiles(next);
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
  };

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          sync([...files, ...Array.from(e.dataTransfer.files)]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          drag ? "border-brand bg-brand/[0.06]" : "border-line hover:border-line-strong hover:bg-fg/[0.02]",
        )}
      >
        <motion.span animate={drag ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
          <UploadCloud className="size-5" />
        </motion.span>
        <span className="mt-3 text-sm font-medium text-fg">{d.common.dropFiles}</span>
        <span className="mt-1 text-xs text-muted">{fmt(d.common.filesHint, { max })}</span>
        <input
          ref={inputRef}
          type="file"
          name={name}
          multiple={max > 1}
          accept={accept ?? (imagesOnly ? "image/png,image/jpeg,image/webp,image/gif" : "image/*,.pdf,.doc,.docx,.txt,.zip")}
          className="sr-only"
          onChange={(e) => sync([...files, ...Array.from(e.target.files ?? [])])}
        />
      </label>
      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 grid gap-2 sm:grid-cols-2">
            {files.map((f, i) => (
              <motion.li key={f.name + i} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 rounded-xl border border-line bg-fg/[0.02] p-2 pr-3">
                {f.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(f)} alt="" className="size-10 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-lg bg-fg/[0.06] text-muted">
                    <FileText className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">{f.name}</span>
                  <span className="text-xs text-muted">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                </span>
                <button type="button" onClick={() => sync(files.filter((_, j) => j !== i))} className="rounded-md p-1 text-muted hover:bg-fg/[0.06] hover:text-fg" aria-label={d.common.remove}>
                  <X className="size-4" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Uploaded files list ---------- */
export type FileRef = { id: string; originalName: string; mimeType: string; size: number };

export function FileList({ files, compact, onRemove }: { files: FileRef[]; compact?: boolean; onRemove?: (id: string) => void }) {
  const { d } = useApp();
  if (!files.length) return null;
  const images = files.filter((f) => f.mimeType.startsWith("image/"));
  const docs = files.filter((f) => !f.mimeType.startsWith("image/"));
  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
          {images.map((f) => (
            <div key={f.id} className="group relative overflow-hidden rounded-xl border border-line">
              <a href={`/api/files/${f.id}`} target="_blank" rel="noopener" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${f.id}`} alt={f.originalName} loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
              {onRemove && (
                <button type="button" onClick={() => onRemove(f.id)} className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-lg bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label={d.common.remove}>
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {docs.map((f) => (
        <div key={f.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
          <Paperclip className="size-4 text-muted" />
          <a href={`/api/files/${f.id}?download`} className="min-w-0 flex-1 truncate text-fg hover:text-brand">
            {f.originalName}
          </a>
          <span className="text-xs text-muted">{(f.size / 1024).toFixed(0)} KB</span>
          {onRemove && (
            <button type="button" onClick={() => onRemove(f.id)} className="rounded-md p-1 text-muted hover:text-danger" aria-label={d.common.remove}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
