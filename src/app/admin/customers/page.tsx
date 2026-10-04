import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { Avatar, Badge, FormattedDate, Money, PageHeader, ProBadge } from "@/components/ui/misc";
import { SearchBox, Table, Td } from "@/components/admin/table";

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { d } = await getI18n();
  const query = q?.trim().slice(0, 80);
  const users = await db.user.findMany({
    where: query ? { OR: [{ email: { contains: query } }, { firstName: { contains: query } }, { lastName: { contains: query } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { membership: true, _count: { select: { orders: { where: { status: { not: "DRAFT" } } } } }, payments: { where: { status: "SUCCEEDED" }, select: { amountGel: true } } },
  });
  const now = new Date();
  return (
    <>
      <PageHeader title={d.admin.nav.customers} subtitle={`${users.length}`} />
      <SearchBox action="/admin/customers" q={q} placeholder={d.common.search} />
      <Table head={[d.admin.customer, d.admin.email, d.admin.orders, d.admin.spent, d.admin.role, d.admin.joined]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td>
              <Link href={`/admin/customers/${u.id}`} className="flex items-center gap-3 font-medium text-fg hover:text-brand">
                <Avatar name={`${u.firstName} ${u.lastName}`} size={30} />
                {u.firstName} {u.lastName}
                {u.membership && u.membership.status !== "EXPIRED" && u.membership.currentPeriodEnd > now && <ProBadge />}
              </Link>
            </Td>
            <Td className="text-fg-soft">{u.email}</Td>
            <Td>{u._count.orders}</Td>
            <Td>
              <Money gel={u.payments.reduce((s, p) => s + p.amountGel, 0)} />
            </Td>
            <Td>{u.role === "ADMIN" ? <Badge tone="red">ADMIN</Badge> : <Badge>CUSTOMER</Badge>}</Td>
            <Td className="text-muted">
              <FormattedDate value={u.createdAt} />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
