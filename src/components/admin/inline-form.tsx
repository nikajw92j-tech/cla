"use client";

import type { ReactNode } from "react";
import { ActionForm, SubmitButton, type AnyResult } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** Compact admin form: raw inputs + a submit button, with the shared toast/loading handling. */
export function InlineForm({ action, children, submitLabel, stacked, reset, className }: { action: (fd: FormData) => Promise<AnyResult>; children: ReactNode; submitLabel: string; stacked?: boolean; reset?: boolean; className?: string }) {
  return (
    <ActionForm action={action} reset={reset} className={cn(stacked ? "space-y-3" : "flex flex-wrap items-end gap-2", className)}>
      {children}
      <SubmitButton size="sm">{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
