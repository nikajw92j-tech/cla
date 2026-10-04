"use client";

import { useTransition } from "react";
import { MailWarning } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/app/actions/auth";

export function VerifyBanner() {
  const { d, t } = useApp();
  const toast = useToast();
  const [pending, start] = useTransition();
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center">
      <MailWarning className="size-5 shrink-0 text-warning" />
      <p className="flex-1 text-sm text-fg">{d.auth.verifyBanner}</p>
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await resendVerificationAction();
            toast(res.ok ? "success" : "error", t(res.ok ? res.message : res.error));
          })
        }
      >
        {d.auth.resend}
      </Button>
    </div>
  );
}
