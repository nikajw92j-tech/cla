import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";
import { safeJson } from "@/lib/utils";
import { Card, EmptyState, PageHeader } from "@/components/ui/misc";
import { NotificationsList, MarkAllButton } from "./list";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.notifications.title };
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const { d } = await getI18n();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <>
      <PageHeader title={d.notifications.title} subtitle={unread ? fmt(d.notifications.unread, { n: unread }) : d.notifications.subtitle} actions={unread ? <MarkAllButton /> : undefined} />
      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<Bell />} title={d.notifications.empty} />
        ) : (
          <NotificationsList
            items={items.map((n) => ({ id: n.id, kind: n.kind, params: safeJson(n.params, {}), link: n.link, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() }))}
          />
        )}
      </Card>
    </>
  );
}
