import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/misc";
import { NewThread } from "./new-thread";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.messages.title };
}

export default async function MessagesIndex({ searchParams }: { searchParams: Promise<{ new?: string; related?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const { d } = await getI18n();
  const [websites, orders, requests] = await Promise.all([
    db.website.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
    db.order.findMany({ where: { userId: user.id, status: { not: "DRAFT" } }, select: { id: true, number: true, brandName: true } }),
    db.modificationRequest.findMany({ where: { userId: user.id }, select: { id: true, number: true, title: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const related = [
    ...websites.map((w) => ({ value: `website:${w.id}`, label: `🌐 ${w.name}` })),
    ...orders.map((o) => ({ value: `order:${o.id}`, label: `📦 ${o.brandName ?? o.number}` })),
    ...requests.map((r) => ({ value: `request:${r.id}`, label: `✏️ ${r.number} — ${r.title}` })),
  ];
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[480px] items-center justify-center rounded-2xl border border-line bg-card backdrop-blur-xl">
      <EmptyState icon={<MessagesSquare />} title={d.messages.pick} text={d.messages.subtitle} action={<NewThread related={related} defaultOpen={!!sp.new} defaultRelated={sp.related} />} />
    </div>
  );
}
