"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Paperclip, SendHorizonal, X } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/providers/toast";
import { Avatar } from "@/components/ui/misc";
import { FileList, type FileRef } from "./widgets";
import { cn } from "@/lib/utils";

export type ChatMessage = { id: string; body: string; mine: boolean; staff: boolean; senderName: string; senderAvatar: string | null; createdAt: string; files: FileRef[] };

/** Chat thread view. `send` is a bound server action (threadId pre-bound). */
export function ChatView({
  messages,
  send,
  title,
  subtitle,
  backHref,
  responseHours,
  pollMs = 10_000,
}: {
  messages: ChatMessage[];
  send: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  title: string;
  subtitle?: React.ReactNode;
  backHref: string;
  responseHours?: number;
  pollMs?: number;
}) {
  const { d, t, date, fmt } = useApp();
  const toast = useToast();
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Live updates: refresh server data periodically while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && router.refresh(), pollMs);
    return () => clearInterval(id);
  }, [router, pollMs]);

  const submit = () => {
    if (!text.trim() && !files.length) return;
    const fd = new FormData();
    fd.set("body", text.trim());
    files.forEach((f) => fd.append("files", f));
    start(async () => {
      const res = await send(fd).catch(() => null);
      if (!res?.ok) return toast("error", t(res?.error ?? "errors.generic"));
      setText("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  let lastDay = "";
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link href={backHref} className="grid size-9 place-items-center rounded-lg hover:bg-fg/[0.06] lg:hidden" aria-label={d.common.back}>
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{title}</p>
          {subtitle && <div className="truncate text-xs text-muted">{subtitle}</div>}
          {responseHours != null && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-success" /> {fmt(d.messages.online, { hours: responseHours })}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((m, i) => {
          const day = date(m.createdAt, { dateStyle: "long" });
          const showDay = day !== lastDay;
          lastDay = day;
          const prev = messages[i - 1];
          const grouped = prev && prev.mine === m.mine && !showDay && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full bg-fg/[0.05] px-3 py-1 text-[11px] text-muted">{day}</span>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={cn("flex items-end gap-2", m.mine ? "flex-row-reverse" : "", grouped ? "mt-1" : "mt-4")}
              >
                <div className="w-8 shrink-0">{!grouped && <Avatar name={m.senderName} src={m.senderAvatar} size={32} />}</div>
                <div className={cn("max-w-[80%] sm:max-w-[70%]", m.mine && "items-end")}>
                  {!grouped && (
                    <p className={cn("mb-1 text-[11px] text-muted", m.mine && "text-right")}>
                      {m.staff ? d.common.team : m.mine ? d.common.you : m.senderName} · {date(m.createdAt, { timeStyle: "short" })}
                    </p>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-[0.93rem] leading-relaxed break-words whitespace-pre-wrap",
                      m.mine ? "rounded-br-md bg-gradient-brand text-white" : "rounded-bl-md border border-line bg-card-solid text-fg",
                    )}
                  >
                    {m.body !== "📎" && m.body}
                    {m.files.length > 0 && (
                      <div className={cn(m.body !== "📎" && "mt-2")}>
                        <FileList files={m.files} compact />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-line p-3"
      >
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-lg bg-fg/[0.06] px-2.5 py-1 text-xs text-fg-soft">
                  <Paperclip className="size-3" /> <span className="max-w-40 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={d.common.remove}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-2">
          <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg" aria-label={d.common.attach}>
            <Paperclip className="size-5" />
            <input
              ref={fileRef}
              type="file"
              multiple
              className="sr-only"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
              onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 5))}
            />
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={5000}
            placeholder={d.messages.placeholder}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-elev/70 px-4 py-2.5 text-[0.95rem] text-fg outline-none placeholder:text-muted focus:border-brand/50 focus:ring-4 focus:ring-brand/10"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={pending || (!text.trim() && !files.length)}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-[0_8px_24px_-8px_var(--brand)] transition-opacity disabled:opacity-40"
            aria-label={d.common.send}
          >
            <SendHorizonal className={cn("size-5", pending && "animate-pulse")} />
          </motion.button>
        </div>
      </form>
    </div>
  );
}

export type ThreadSummary = { id: string; subject: string; preview: string; at: string; unread: number; who?: string };

export function ThreadList({ threads, base, newHref }: { threads: ThreadSummary[]; base: string; newHref?: string }) {
  const { d, rel } = useApp();
  const pathname = usePathname();
  return (
    <ul className="divide-y divide-line">
      {threads.map((th) => {
        const active = pathname === `${base}/${th.id}`;
        return (
          <li key={th.id}>
            <Link href={`${base}/${th.id}`} className={cn("relative flex gap-3 px-4 py-3.5 transition-colors", active ? "bg-brand/[0.07]" : "hover:bg-fg/[0.03]")}>
              {active && <motion.span layoutId={`thread-${base}`} className="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-brand to-brand-2" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm", th.unread ? "font-semibold text-fg" : "font-medium text-fg-soft")}>{th.subject}</p>
                  <span className="shrink-0 text-[11px] text-muted" suppressHydrationWarning>{rel(th.at)}</span>
                </div>
                {th.who && <p className="truncate text-xs text-brand">{th.who}</p>}
                <p className="truncate text-xs text-muted">{th.preview}</p>
              </div>
              {th.unread > 0 && <span className="mt-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">{th.unread}</span>}
            </Link>
          </li>
        );
      })}
      {threads.length === 0 && (
        <li className="px-4 py-10 text-center text-sm text-muted">
          {d.messages.empty}
          {newHref && (
            <Link href={newHref} className="mt-2 block font-medium text-brand hover:underline">
              {d.messages.emptyCta}
            </Link>
          )}
        </li>
      )}
    </ul>
  );
}
