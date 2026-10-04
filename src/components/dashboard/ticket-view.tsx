"use client";

import { motion } from "framer-motion";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, SubmitButton, Textarea } from "@/components/ui/form";
import { Avatar } from "@/components/ui/misc";
import { FileDrop, FileList, type FileRef } from "./widgets";
import { cn } from "@/lib/utils";
import type { AnyResult } from "@/components/ui/form";

export type TicketReplyView = { id: string; body: string; staff: boolean; author: string; createdAt: string; files: FileRef[] };

/** Ticket conversation used by both the customer and admin screens. */
export function TicketView({ replies, reply, closed, viewerIsStaff }: { replies: TicketReplyView[]; reply: (fd: FormData) => Promise<AnyResult>; closed: boolean; viewerIsStaff: boolean }) {
  const { d, date } = useApp();
  return (
    <div className="space-y-4">
      {replies.map((r, i) => {
        const mine = r.staff === viewerIsStaff;
        return (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cn("glass rounded-2xl p-5", r.staff && "border-brand/25")}>
            <div className="mb-3 flex items-center gap-3">
              <Avatar name={r.staff ? "Nexora Team" : r.author} size={32} />
              <div>
                <p className="text-sm font-medium text-fg">{r.staff ? d.common.team : mine ? d.common.you : r.author}</p>
                <p className="text-xs text-muted">{date(r.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-fg-soft">{r.body}</p>
            {r.files.length > 0 && (
              <div className="mt-3">
                <FileList files={r.files} compact />
              </div>
            )}
          </motion.div>
        );
      })}
      {!closed && (
        <ActionForm action={reply} reset className="glass space-y-3 rounded-2xl p-5">
          <Textarea name="body" label={d.support.reply} rows={4} maxLength={5000} />
          <FileDrop max={5} />
          <SubmitButton>{d.common.send}</SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
