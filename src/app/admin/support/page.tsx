import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { TICKET_STATUSES, isOneOf } from "@/lib/catalog";
import { FormattedDate, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { StatusFilter, Table, Td } from "@/components/admin/table";

export default async function AdminSupport({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { d } = await getI18n();
  const filter = isOneOf(TICKET_STATUSES, status) ? status : undefined;
  const tickets = await db.supportTicket.findMany({
    where: filter ? { status: filter } : {},
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: { user: { include: { membership: true } }, replies: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <>
      <PageHeader title={d.admin.nav.support} />
      <StatusFilter base="/admin/support" active={filter} allLabel={d.common.all} options={TICKET_STATUSES.map((s) => ({ value: s, label: d.status.ticket[s] }))} />
      <Table head={[d.support.ticketId, d.support.subject, d.admin.customer, d.common.status, d.support.latestReply]}>
        {tickets.map((t) => (
          <tr key={t.id}>
            <Td className="font-mono text-xs">{t.number}</Td>
            <Td>
              <Link href={`/admin/support/${t.id}`} className="font-medium text-fg hover:text-brand">
                {t.subject}
              </Link>
              <p className="text-xs text-muted">
                <T k={`labels.ticketCategory.${t.category}`} />
              </p>
            </Td>
            <Td className="text-fg-soft">
              {t.user.firstName} {t.user.lastName}
              {t.user.membership?.status === "ACTIVE" && <span className="ml-1.5 text-[10px] font-bold text-gold">PRO</span>}
            </Td>
            <Td>
              <StatusBadge kind="ticket" value={t.status} />
            </Td>
            <Td className="text-muted">{t.replies[0] && <FormattedDate value={t.replies[0].createdAt} relative />}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
