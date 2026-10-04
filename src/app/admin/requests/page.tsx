import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { REQUEST_STATUSES, isOneOf } from "@/lib/catalog";
import { Badge, FormattedDate, Money, PageHeader, ProBadge, StatusBadge, T } from "@/components/ui/misc";
import { StatusFilter, Table, Td } from "@/components/admin/table";

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { d } = await getI18n();
  const filter = isOneOf(REQUEST_STATUSES, status) ? status : undefined;
  const rows = await db.modificationRequest.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: "desc" }, take: 300, include: { user: true } });
  // Pro members' requests go first (priority queue), then by priority.
  rows.sort((a, b) => Number(b.wasPro) - Number(a.wasPro) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  return (
    <>
      <PageHeader title={d.admin.nav.requests} />
      <StatusFilter base="/admin/requests" active={filter} allLabel={d.common.all} options={REQUEST_STATUSES.map((s) => ({ value: s, label: d.status.request[s] }))} />
      <Table head={[d.requests.form.requestTitle, d.admin.customer, d.requests.form.priority, d.common.status, d.common.price, d.common.date]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td>
              <Link href={`/admin/requests/${r.id}`} className="font-medium text-fg hover:text-brand">
                {r.title}
              </Link>
              <p className="text-xs text-muted">
                {r.number} · <T k={`labels.category.${r.category}`} />
              </p>
            </Td>
            <Td className="text-fg-soft">
              <span className="flex items-center gap-1.5">
                {r.user.firstName} {r.user.lastName} {r.wasPro && <ProBadge />}
              </span>
            </Td>
            <Td>
              <Badge tone={r.priority === "URGENT" ? "red" : r.priority === "HIGH" ? "amber" : "gray"}>
                <T k={`labels.priority.${r.priority}`} />
              </Badge>
            </Td>
            <Td>
              <StatusBadge kind="request" value={r.status} />
            </Td>
            <Td>{r.finalGel ? <Money gel={r.finalGel} approx={false} /> : <span className="text-success">{d.common.free}</span>}</Td>
            <Td className="text-muted">
              <FormattedDate value={r.createdAt} />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
