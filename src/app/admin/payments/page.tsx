import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { PAYMENT_STATUSES, isOneOf } from "@/lib/catalog";
import { FormattedDate, Money, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { StatusFilter, Table, Td } from "@/components/admin/table";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminMarkPaidAction, adminRefundAction } from "@/app/actions/admin";

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { d } = await getI18n();
  const filter = isOneOf(PAYMENT_STATUSES, status) ? status : undefined;
  const payments = await db.payment.findMany({ where: filter ? { status: filter } : {}, orderBy: { createdAt: "desc" }, take: 300, include: { user: true, invoice: true } });
  return (
    <>
      <PageHeader title={d.admin.nav.payments} />
      <StatusFilter base="/admin/payments" active={filter} allLabel={d.common.all} options={PAYMENT_STATUSES.map((s) => ({ value: s, label: d.status.payment[s] }))} />
      <Table head={[d.invoices.number, d.admin.customer, d.invoices.description, d.common.status, d.invoices.amount, d.common.date, d.common.actions]}>
        {payments.map((p) => (
          <tr key={p.id}>
            <Td className="font-mono text-xs">
              {p.invoice ? (
                <Link href={`/dashboard/invoices/${p.invoice.id}`} className="hover:text-brand">
                  {p.invoice.number}
                </Link>
              ) : (
                "—"
              )}
            </Td>
            <Td className="text-fg-soft">
              {p.user.firstName} {p.user.lastName}
            </Td>
            <Td>
              <T k={`invoices.purposes.${p.purpose}`} /> · <span className="text-muted"><T k={`labels.paymentMethod.${p.method}`} /></span>
            </Td>
            <Td>
              <StatusBadge kind="payment" value={p.status} />
            </Td>
            <Td className="font-medium">
              <Money gel={p.amountGel} approx={false} />
            </Td>
            <Td className="text-muted">
              <FormattedDate value={p.createdAt} />
            </Td>
            <Td>
              {p.status === "PENDING" && (
                <ActionButton action={adminMarkPaidAction.bind(null, p.id)} size="sm">
                  {d.admin.markPaid}
                </ActionButton>
              )}
              {p.status === "SUCCEEDED" && p.amountGel > 0 && (
                <ActionButton action={adminRefundAction.bind(null, p.id)} size="sm" variant="ghost" confirm={`${d.admin.refund}?`}>
                  {d.admin.refund}
                </ActionButton>
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
