import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { ORDER_STATUSES } from "@/lib/catalog";
import { safeJson } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, Money, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { FileList } from "@/components/dashboard/widgets";
import { ActionButton } from "@/components/dashboard/action-button";
import { InlineForm } from "@/components/admin/inline-form";
import { adminMarkPaidAction, adminUpdateOrderStatusAction } from "@/app/actions/admin";
import type { Feature } from "@/lib/catalog";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { d } = await getI18n();
  const o = await db.order.findUnique({ where: { id }, include: { user: true, package: true, files: true, website: true, discountCode: true, payments: { include: { invoice: true } } } });
  if (!o) notFound();
  const features = safeJson<Feature[]>(o.features, []);
  const w = d.wizard.s2;
  const rows: [string, React.ReactNode][] = [
    [w.websiteType, o.websiteType ? <T key="t" k={`labels.websiteType.${o.websiteType}`} /> : "—"],
    [w.industry, o.industry],
    [w.pages, o.pagesCount],
    [w.style, o.style ? <T key="s" k={`labels.style.${o.style}`} /> : "—"],
    [w.colors, o.colors],
    [d.wizard.s5.features, features.map((f) => d.labels.feature[f]).join(", ") || "—"],
    [w.description, <span key="d" className="whitespace-pre-line">{o.description}</span>],
    [w.functionality, <span key="f" className="whitespace-pre-line">{o.functionality}</span>],
    [w.examples, <span key="e" className="break-all whitespace-pre-line">{o.examples}</span>],
  ];
  return (
    <>
      <PageHeader
        title={o.brandName ?? o.number}
        subtitle={
          <>
            {o.number} ·{" "}
            <Link href={`/admin/customers/${o.userId}`} className="text-brand hover:underline">
              {o.user.firstName} {o.user.lastName}
            </Link>
          </>
        }
        actions={<StatusBadge kind="order" value={o.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={d.orders.brief} />
          <dl className="divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_1fr]">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-sm text-fg">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          {o.files.length > 0 && (
            <div className="border-t border-line p-5">
              <FileList files={o.files} />
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.admin.updateStatus} />
            <div className="space-y-4 p-5">
              <InlineForm action={adminUpdateOrderStatusAction.bind(null, o.id)} submitLabel={d.common.save}>
                <select name="status" defaultValue={o.status} className="h-10 flex-1 rounded-xl border border-line bg-elev px-3 text-sm">
                  {ORDER_STATUSES.filter((s) => s !== "DRAFT").map((s) => (
                    <option key={s} value={s}>
                      {d.status.order[s]}
                    </option>
                  ))}
                </select>
              </InlineForm>
              {o.website && (
                <ButtonLink href={`/admin/websites/${o.website.id}`} variant="secondary" className="w-full">
                  {d.admin.nav.websites} → {o.website.name}
                </ButtonLink>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title={d.orders.summary} />
            <dl className="space-y-2 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{d.wizard.s5.basePrice}</dt><dd><Money gel={o.basePriceGel} approx={false} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">{d.wizard.s5.addons}</dt><dd><Money gel={o.featuresPriceGel} approx={false} /></dd></div>
              <div className="flex justify-between"><dt className="text-muted">{d.wizard.s5.discount}{o.discountCode ? ` (${o.discountCode.code})` : ""}</dt><dd>−<Money gel={o.discountGel} approx={false} /></dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>{d.common.total}</dt><dd><Money gel={o.totalGel} approx={false} /></dd></div>
            </dl>
            <ul className="divide-y divide-line border-t border-line">
              {o.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                  <span className="flex items-center gap-2">
                    <StatusBadge kind="payment" value={p.status} /> <T k={`labels.paymentMethod.${p.method}`} />
                  </span>
                  {p.status === "PENDING" && (
                    <ActionButton action={adminMarkPaidAction.bind(null, p.id)} size="sm">
                      {d.admin.markPaid}
                    </ActionButton>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
