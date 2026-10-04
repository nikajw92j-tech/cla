import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { Badge, Card, CardHeader, FormattedDate, PageHeader } from "@/components/ui/misc";
import { Table, Td } from "@/components/admin/table";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminDeleteDiscountAction, adminToggleDiscountAction } from "@/app/actions/admin";
import { DiscountForm } from "./form";

export default async function AdminDiscounts() {
  const { d } = await getI18n();
  const a = d.admin;
  const codes = await db.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title={a.nav.discounts} />
      <Card className="mb-6">
        <CardHeader title={a.create} />
        <div className="p-5">
          <DiscountForm />
        </div>
      </Card>
      <Table head={[a.code, a.value, a.appliesTo, a.uses, a.endsAt, d.common.status, d.common.actions]}>
        {codes.map((c) => (
          <tr key={c.id}>
            <Td>
              <span className="font-mono font-semibold text-fg">{c.code}</span>
              {c.description && <p className="text-xs text-muted">{c.description}</p>}
            </Td>
            <Td>{c.type === "PERCENT" ? `${c.value}%` : `${c.value} ₾`}</Td>
            <Td>
              <span className="flex flex-wrap gap-1">
                <Badge>{c.appliesTo}</Badge>
                {c.packageSlug && <Badge tone="violet">{c.packageSlug}</Badge>}
                {c.proOnly && <Badge tone="amber">PRO</Badge>}
              </span>
            </Td>
            <Td>
              {c.usedCount}
              {c.maxUses ? ` / ${c.maxUses}` : ""}
            </Td>
            <Td className="text-muted">{c.endsAt ? <FormattedDate value={c.endsAt} /> : "—"}</Td>
            <Td>{c.active ? <Badge tone="green">{a.activeLabel}</Badge> : <Badge>—</Badge>}</Td>
            <Td>
              <div className="flex gap-1.5">
                <ActionButton action={adminToggleDiscountAction.bind(null, c.id)} size="sm" variant="secondary">
                  {c.active ? a.unapprove : a.activeLabel}
                </ActionButton>
                <ActionButton action={adminDeleteDiscountAction.bind(null, c.id)} size="sm" variant="danger" confirm={`${d.common.delete}?`}>
                  {d.common.delete}
                </ActionButton>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
