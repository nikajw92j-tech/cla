"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/misc";
import { ActionButton } from "@/components/dashboard/action-button";
import type { AnyResult } from "@/components/ui/form";

export function SubscribeButton({ priceGel, action }: { priceGel: number; action: () => Promise<AnyResult> }) {
  const { d, money, fmt } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="gold" size="lg" className="relative mt-8 w-full" icon={<Crown className="size-4" />} onClick={() => setOpen(true)}>
        {d.pro.subscribe}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={d.pro.confirmTitle}>
        <p className="text-fg-soft">{fmt(d.pro.confirmText, { price: money(priceGel) })}</p>
        <p className="mt-2 text-xs text-muted">{d.common.approxNote}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {d.common.cancel}
          </Button>
          <ActionButton action={action} variant="gold">
            {d.pro.confirm}
          </ActionButton>
        </div>
      </Modal>
    </>
  );
}
