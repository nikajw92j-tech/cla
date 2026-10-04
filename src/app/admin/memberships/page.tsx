import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { FormattedDate, Money, PageHeader, ProgressBar, StatusBadge } from "@/components/ui/misc";
import { Table, Td } from "@/components/admin/table";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminResetCreditsAction, adminRevokeProAction } from "@/app/actions/admin";

export default async function AdminMemberships() {
  const { d } = await getI18n();
  const rows = await db.proMembership.findMany({ orderBy: { startedAt: "desc" }, include: { user: true } });
  const now = new Date();
  return (
    <>
      <PageHeader title={d.admin.nav.memberships} subtitle={d.admin.grantPro + " → " + d.admin.nav.customers} />
      <Table head={[d.admin.customer, d.common.status, d.admin.freeMods, d.common.price, d.pro.renewLabel, d.common.actions]}>
        {rows.map((m) => {
          const expired = m.currentPeriodEnd <= now || m.status === "EXPIRED";
          return (
            <tr key={m.id}>
              <Td>
                <Link href={`/admin/customers/${m.userId}`} className="font-medium text-fg hover:text-brand">
                  {m.user.firstName} {m.user.lastName}
                </Link>
              </Td>
              <Td>
                <StatusBadge kind="pro" value={expired ? "EXPIRED" : m.status} />
              </Td>
              <Td className="w-44">
                <div className="flex items-center gap-2">
                  <ProgressBar value={((m.freeModsTotal - m.freeModsUsed) / m.freeModsTotal) * 100} tone="gold" className="h-1.5" />
                  <span className="text-xs whitespace-nowrap text-muted">
                    {m.freeModsTotal - m.freeModsUsed}/{m.freeModsTotal}
                  </span>
                </div>
              </Td>
              <Td>
                <Money gel={m.priceGel} approx={false} />
              </Td>
              <Td className="text-muted">
                <FormattedDate value={m.currentPeriodEnd} />
              </Td>
              <Td>
                {!expired && (
                  <div className="flex gap-1.5">
                    <ActionButton action={adminResetCreditsAction.bind(null, m.userId)} size="sm" variant="secondary">
                      {d.admin.resetCredits}
                    </ActionButton>
                    <ActionButton action={adminRevokeProAction.bind(null, m.userId)} size="sm" variant="danger" confirm={`${d.admin.revokePro}?`}>
                      {d.admin.revokePro}
                    </ActionButton>
                  </div>
                )}
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
