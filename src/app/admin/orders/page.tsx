import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { ORDER_STATUSES, isOneOf } from "@/lib/catalog";
import { FormattedDate, Money, PageHeader, StatusBadge } from "@/components/ui/misc";
import { StatusFilter, Table, Td } from "@/components/admin/table";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { d } = await getI18n();
  const filter = isOneOf(ORDER_STATUSES, status) ? status : undefined;
  const orders = await db.order.findMany({
    where: filter ? { status: filter } : { status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true, package: true },
  });
  return (
    <>
      <PageHeader title={d.admin.nav.orders} />
      <StatusFilter base="/admin/orders" active={filter} allLabel={d.common.all} options={ORDER_STATUSES.map((s) => ({ value: s, label: d.status.order[s] }))} />
      <Table head={[d.orders.number, d.admin.customer, d.admin.package, d.common.status, d.common.total, d.common.date]}>
        {orders.map((o) => (
          <tr key={o.id}>
            <Td>
              <Link href={`/admin/orders/${o.id}`} className="font-medium text-fg hover:text-brand">
                {o.brandName ?? "—"}
                <span className="block font-mono text-xs text-muted">{o.number}</span>
              </Link>
            </Td>
            <Td>
              <Link href={`/admin/customers/${o.userId}`} className="text-fg-soft hover:text-brand">
                {o.user.firstName} {o.user.lastName}
              </Link>
            </Td>
            <Td className="capitalize">{o.package?.slug}</Td>
            <Td>
              <StatusBadge kind="order" value={o.status} />
            </Td>
            <Td className="font-medium">
              <Money gel={o.totalGel} approx={false} />
            </Td>
            <Td className="text-muted">
              <FormattedDate value={o.createdAt} />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
