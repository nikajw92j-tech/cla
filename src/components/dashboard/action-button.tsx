"use client";

import { useTransition, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import type { AnyResult } from "@/components/ui/form";

/** A button that runs a bound server action with loading/success/error feedback. */
export function ActionButton({
  action,
  confirm,
  children,
  ...rest
}: Omit<ComponentProps<typeof Button>, "onClick" | "action"> & { action: () => Promise<AnyResult>; confirm?: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const { t } = useApp();
  const router = useRouter();
  return (
    <Button
      {...rest}
      loading={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action().catch(() => null);
          if (!res) return toast("error", t("errors.generic"));
          if (!res.ok) return toast("error", t(res.error));
          if (res.message) toast("success", t(res.message));
          if (res.redirect) router.push(res.redirect);
          else router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}
