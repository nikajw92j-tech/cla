"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, CheckCheck, CreditCard, Crown, MessageSquare, Package, Wand2 } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { useNotificationText, type NotificationItem } from "@/components/dashboard/notification-bell";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof Bell> = {
  orderSubmitted: Package,
  orderPaid: CreditCard,
  paymentConfirmed: CreditCard,
  requestStatus: Wand2,
  requestInProgress: Wand2,
  newMessage: MessageSquare,
  ticketReply: MessageSquare,
  proActivated: Crown,
  proCancelled: Crown,
};

async function mark(body: object) {
  await fetch("/api/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function MarkAllButton() {
  const { d } = useApp();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      loading={pending}
      icon={<CheckCheck className="size-4" />}
      onClick={() =>
        start(async () => {
          await mark({ all: true });
          router.refresh();
        })
      }
    >
      {d.notifications.markAll}
    </Button>
  );
}

export function NotificationsList({ items }: { items: NotificationItem[] }) {
  const { rel } = useApp();
  const text = useNotificationText();
  return (
    <ul className="divide-y divide-line">
      {items.map((n, i) => {
        const Icon = ICON[n.kind] ?? Bell;
        return (
          <motion.li key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
            <Link
              href={n.link ?? "#"}
              onClick={() => !n.readAt && mark({ id: n.id })}
              className={cn("flex items-start gap-4 px-5 py-4 transition-colors hover:bg-fg/[0.02]", !n.readAt && "bg-brand/[0.035]")}
            >
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", n.readAt ? "bg-fg/[0.05] text-muted" : "bg-brand/12 text-brand")}>
                <Icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm", n.readAt ? "text-fg-soft" : "font-medium text-fg")}>{text(n)}</span>
                <span className="text-xs text-muted" suppressHydrationWarning>{rel(n.createdAt)}</span>
              </span>
              {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
