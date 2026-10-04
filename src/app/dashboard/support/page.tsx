import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Crown } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, isProActive } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { Card, EmptyState, FormattedDate, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { NewTicket } from "./new-ticket";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.support.title };
}

export default async function SupportPage() {
  const user = await requireUser();
  const { d } = await getI18n();
  const tickets = await db.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { replies: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <>
      <PageHeader title={d.support.title} subtitle={d.support.subtitle} actions={<NewTicket />} />
      {isProActive(user) && (
        <p className="mb-4 flex items-center gap-2 text-sm text-gold">
          <Crown className="size-4" /> {d.support.priorityNote}
        </p>
      )}
      <Card className="overflow-hidden">
        {tickets.length === 0 ? (
          <EmptyState icon={<LifeBuoy />} title={d.support.empty} action={<NewTicket />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">{d.support.ticketId}</th>
                  <th className="px-5 py-3 font-medium">{d.support.subject}</th>
                  <th className="px-5 py-3 font-medium">{d.common.status}</th>
                  <th className="px-5 py-3 font-medium">{d.common.date}</th>
                  <th className="px-5 py-3 font-medium">{d.support.latestReply}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-5 py-3.5 font-mono text-xs text-fg">
                      <Link href={`/dashboard/support/${t.id}`} className="hover:text-brand">
                        {t.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/support/${t.id}`} className="font-medium text-fg hover:text-brand">
                        {t.subject}
                      </Link>
                      <p className="text-xs text-muted">
                        <T k={`labels.ticketCategory.${t.category}`} />
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge kind="ticket" value={t.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      <FormattedDate value={t.createdAt} />
                    </td>
                    <td className="max-w-xs px-5 py-3.5">
                      <p className="truncate text-fg-soft">{t.replies[0]?.body}</p>
                      {t.replies[0] && (
                        <p className="text-xs text-muted">
                          {t.replies[0].fromStaff ? d.common.team : d.common.you} · <FormattedDate value={t.replies[0].createdAt} relative />
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
