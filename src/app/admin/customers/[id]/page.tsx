import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";
import { Avatar, Card, CardHeader, FormattedDate, Money, PageHeader, ProBadge, StatusBadge } from "@/components/ui/misc";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminGrantProAction, adminResetCreditsAction, adminRevokeProAction, adminSetRoleAction, adminStartThreadAction } from "@/app/actions/admin";
import { InlineForm } from "@/components/admin/inline-form";

export default async function AdminCustomer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { d } = await getI18n();
  const u = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      membership: true,
      orders: { where: { status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" } },
      websites: true,
      requests: { orderBy: { createdAt: "desc" }, take: 10 },
      payments: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!u) notFound();
  const m = u.membership;
  const proActive = !!m && m.status !== "EXPIRED" && m.currentPeriodEnd > new Date();

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={`${u.firstName} ${u.lastName}`} src={u.profile?.avatarFileId ? `/api/files/${u.profile.avatarFileId}` : null} size={40} />
            {u.firstName} {u.lastName} {proActive && <ProBadge />}
          </span>
        }
        subtitle={`${u.email}${u.profile?.phone ? ` · ${u.profile.phone}` : ""}${u.profile?.company ? ` · ${u.profile.company}` : ""}`}
        actions={
          <ActionButton action={adminSetRoleAction.bind(null, u.id, u.role === "ADMIN" ? "CUSTOMER" : "ADMIN")} variant="ghost" size="sm" confirm={`${u.role === "ADMIN" ? "CUSTOMER" : d.admin.makeAdmin}?`}>
            {u.role === "ADMIN" ? "→ CUSTOMER" : d.admin.makeAdmin}
          </ActionButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={d.admin.nav.memberships} action={m && <StatusBadge kind="pro" value={proActive ? m.status : "EXPIRED"} />} />
          <div className="space-y-4 p-5">
            {m && proActive && (
              <p className="text-sm text-fg-soft">
                {fmt(d.pro.freeRemaining, { left: m.freeModsTotal - m.freeModsUsed, total: m.freeModsTotal })} · <FormattedDate value={m.currentPeriodEnd} />
              </p>
            )}
            <InlineForm action={adminGrantProAction.bind(null, u.id)} submitLabel={d.admin.grantPro}>
              <input name="days" type="number" defaultValue={30} min={1} max={365} className="h-10 w-24 rounded-xl border border-line bg-elev px-3 text-sm" aria-label="days" />
            </InlineForm>
            {proActive && (
              <div className="flex gap-2">
                <ActionButton action={adminResetCreditsAction.bind(null, u.id)} variant="secondary" size="sm">
                  {d.admin.resetCredits}
                </ActionButton>
                <ActionButton action={adminRevokeProAction.bind(null, u.id)} variant="danger" size="sm" confirm={`${d.admin.revokePro}?`}>
                  {d.admin.revokePro}
                </ActionButton>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title={d.messages.newThread} />
          <div className="p-5">
            <InlineForm action={adminStartThreadAction.bind(null, u.id)} submitLabel={d.common.send} stacked>
              <input name="subject" placeholder={d.messages.subject} className="h-10 w-full rounded-xl border border-line bg-elev px-3 text-sm" maxLength={140} />
              <textarea name="body" placeholder={d.messages.placeholder} rows={3} className="w-full rounded-xl border border-line bg-elev px-3 py-2 text-sm" maxLength={5000} />
            </InlineForm>
          </div>
        </Card>
        <Card>
          <CardHeader title={d.admin.nav.orders} />
          <ul className="divide-y divide-line">
            {u.orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-fg/[0.02]">
                  <span className="text-sm text-fg">{o.brandName ?? o.number}</span>
                  <StatusBadge kind="order" value={o.status} />
                </Link>
              </li>
            ))}
            {!u.orders.length && <li className="px-5 py-4 text-sm text-muted">{d.orders.empty}</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title={d.admin.nav.requests} />
          <ul className="divide-y divide-line">
            {u.requests.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-fg/[0.02]">
                  <span className="truncate text-sm text-fg">{r.title}</span>
                  <StatusBadge kind="request" value={r.status} />
                </Link>
              </li>
            ))}
            {!u.requests.length && <li className="px-5 py-4 text-sm text-muted">{d.requests.empty}</li>}
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={d.admin.nav.payments} />
          <ul className="divide-y divide-line">
            {u.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-fg-soft">
                  {d.invoices.purposes[p.purpose as keyof typeof d.invoices.purposes]} · <FormattedDate value={p.createdAt} />
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge kind="payment" value={p.status} />
                  <Money gel={p.amountGel} approx={false} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
