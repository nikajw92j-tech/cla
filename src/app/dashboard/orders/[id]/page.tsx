import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, CreditCard, FileText, Globe2, MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getPackages } from "@/lib/content";
import { safeJson } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, FormattedDate, Money, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { FileList, StageTracker } from "@/components/dashboard/widgets";
import { ActionButton } from "@/components/dashboard/action-button";
import { resumePaymentAction } from "@/app/actions/account";
import type { Feature } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.orders.title };
}

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string }> }) {
  const { id } = await params;
  const { success } = await searchParams;
  const user = await requireUser();
  const { d, locale } = await getI18n();
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: { package: true, files: true, website: true, payments: { include: { invoice: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  if (order.status === "DRAFT") redirect(`/dashboard/orders/new?draft=${order.id}`);
  const packages = await getPackages(locale);
  const pkg = packages.find((p) => p.slug === order.package?.slug);
  const features = safeJson<Feature[]>(order.features, []);
  const payment = order.payments[0];
  const awaiting = payment && (payment.status === "PENDING" || payment.status === "FAILED");

  return (
    <>
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-5 py-4">
          <CheckCircle2 className="size-6 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-fg">{d.wizard.s6.successTitle}</p>
            <p className="text-sm text-muted">{d.wizard.s6.successText}</p>
          </div>
        </div>
      )}
      <PageHeader
        title={order.brandName ?? order.number}
        subtitle={
          <>
            {order.number} · {pkg?.name} · <FormattedDate value={order.createdAt} />
          </>
        }
        actions={
          <>
            <StatusBadge kind="order" value={order.status} />
            <ButtonLink href={`/dashboard/messages?new=1&related=order:${order.id}`} variant="secondary" size="sm" icon={<MessageSquare className="size-4" />}>
              {d.requests.discuss}
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {order.website && (
            <Card>
              <CardHeader title={d.dash.projectProgress} action={<StatusBadge kind="website" value={order.website.status} />} />
              <div className="p-5">
                <StageTracker stage={order.website.stage} progress={order.website.progress} eta={order.website.estimatedCompletion} />
                <div className="mt-5 flex justify-end">
                  <ButtonLink href={`/dashboard/websites/${order.website.id}`} variant="ghost" size="sm" icon={<Globe2 className="size-4" />}>
                    {d.common.details}
                  </ButtonLink>
                </div>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title={d.orders.brief} />
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              <Item label={d.wizard.s2.websiteType} value={order.websiteType ? <T k={`labels.websiteType.${order.websiteType}`} /> : "—"} />
              <Item label={d.wizard.s2.industry} value={order.industry} />
              <Item label={d.wizard.s2.pages} value={order.pagesCount} />
              <Item label={d.wizard.s2.style} value={order.style ? <T k={`labels.style.${order.style}`} /> : "—"} />
              <Item label={d.wizard.s2.colors} value={order.colors} />
              <Item
                label={d.wizard.s5.features}
                value={
                  features.length ? (
                    <span className="flex flex-wrap gap-1">
                      {features.map((f) => (
                        <span key={f} className="rounded-md bg-fg/[0.06] px-2 py-0.5 text-xs">
                          {d.labels.feature[f]}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <Item className="sm:col-span-2" label={d.wizard.s2.description} value={<span className="whitespace-pre-line">{order.description}</span>} />
              {order.functionality && <Item className="sm:col-span-2" label={d.wizard.s2.functionality} value={<span className="whitespace-pre-line">{order.functionality}</span>} />}
              {order.examples && <Item className="sm:col-span-2" label={d.wizard.s2.examples} value={<span className="break-all whitespace-pre-line">{order.examples}</span>} />}
            </dl>
            {order.files.length > 0 && (
              <div className="border-t border-line p-5">
                <FileList files={order.files} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={d.orders.summary} />
            <dl className="space-y-2.5 p-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{d.wizard.s5.basePrice}</dt>
                <dd><Money gel={order.basePriceGel} /></dd>
              </div>
              {order.featuresPriceGel > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">{d.wizard.s5.addons}</dt>
                  <dd>+<Money gel={order.featuresPriceGel} /></dd>
                </div>
              )}
              {order.discountGel > 0 && (
                <div className="flex justify-between text-success">
                  <dt>{d.wizard.s5.discount}</dt>
                  <dd>−<Money gel={order.discountGel} /></dd>
                </div>
              )}
              <div className="flex items-end justify-between border-t border-line pt-3">
                <dt className="font-medium text-fg">{d.common.total}</dt>
                <dd className="font-display text-2xl font-semibold text-fg"><Money gel={order.totalGel} /></dd>
              </div>
            </dl>
          </Card>
          {payment && (
            <Card>
              <CardHeader title={d.orders.payment} action={<StatusBadge kind="payment" value={payment.status} />} />
              <div className="space-y-3 p-5 text-sm">
                <p className="flex items-center gap-2 text-fg-soft">
                  <CreditCard className="size-4 text-muted" /> <T k={`labels.paymentMethod.${payment.method}`} />
                </p>
                {payment.invoice && (
                  <ButtonLink href={`/dashboard/invoices/${payment.invoice.id}`} variant="secondary" size="sm" icon={<FileText className="size-4" />} className="w-full">
                    {d.invoices.number} {payment.invoice.number}
                  </ButtonLink>
                )}
                {awaiting && payment.method === "CARD" && (
                  <ActionButton action={resumePaymentAction.bind(null, payment.id)} className="w-full">
                    {d.orders.pay}
                  </ActionButton>
                )}
                {awaiting && payment.method === "BANK_TRANSFER" && <p className="text-xs text-muted">{d.wizard.s6.bankDesc}</p>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Item({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-fg">{value || "—"}</dd>
    </div>
  );
}
