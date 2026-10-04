import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, MessageSquare, PartyPopper } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, CardHeader, FormattedDate, Money, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { FileList, RequestTimeline } from "@/components/dashboard/widgets";
import { ActionButton } from "@/components/dashboard/action-button";
import { cancelRequestAction, confirmRequestDoneAction } from "@/app/actions/requests";
import { resumePaymentAction } from "@/app/actions/account";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.requests.title };
}

export default async function RequestDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const user = await requireUser();
  const { d } = await getI18n();
  const r = await db.modificationRequest.findFirst({
    where: { id, userId: user.id },
    include: { events: { orderBy: { createdAt: "asc" } }, files: true, website: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!r) notFound();
  const payment = r.payments[0];
  const unpaid = r.finalGel > 0 && payment && payment.status !== "SUCCEEDED" && r.status !== "CANCELLED";
  const cancellable = ["SUBMITTED", "REVIEWING", "APPROVED"].includes(r.status);

  return (
    <>
      {isNew && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-5 py-4">
          <PartyPopper className="size-6 shrink-0 text-success" />
          <p className="font-medium text-fg">{d.success.requestSubmitted}</p>
        </div>
      )}
      <PageHeader
        title={r.title}
        subtitle={
          <>
            {r.number} · <FormattedDate value={r.createdAt} opts={{ dateStyle: "medium", timeStyle: "short" }} />
          </>
        }
        actions={<StatusBadge kind="request" value={r.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {r.status === "WAITING_CUSTOMER" && (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand/[0.06] p-5 sm:flex-row sm:items-center">
              <CheckCircle2 className="size-6 shrink-0 text-brand" />
              <p className="flex-1 text-sm text-fg">{d.requests.timeline.completed}</p>
              <ActionButton action={confirmRequestDoneAction.bind(null, r.id)}>{d.requests.confirmDone}</ActionButton>
            </div>
          )}
          <Card>
            <CardHeader title={d.common.details} />
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone="violet">
                  <T k={`labels.category.${r.category}`} />
                </Badge>
                <Badge tone={r.priority === "URGENT" ? "red" : r.priority === "HIGH" ? "amber" : "gray"}>
                  <T k={`labels.priority.${r.priority}`} />
                </Badge>
                <a href={r.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                  {r.websiteUrl.replace(/^https?:\/\//, "")} <ExternalLink className="size-3.5" />
                </a>
              </div>
              <p className="leading-relaxed whitespace-pre-line text-fg-soft">{r.description}</p>
              {r.notes && (
                <div className="rounded-xl border border-line bg-fg/[0.02] p-4">
                  <p className="text-xs font-medium text-muted">{d.requests.notes}</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-fg-soft">{r.notes}</p>
                </div>
              )}
              {r.files.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-fg">{d.requests.attachments}</p>
                  <FileList files={r.files} />
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.requests.timeline.title} />
            <div className="p-5">
              <RequestTimeline status={r.status} events={r.events} />
            </div>
          </Card>
          <Card>
            <CardHeader title={d.requests.price.title} />
            <dl className="space-y-2.5 p-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{d.requests.price.estimated}</dt>
                <dd><Money gel={r.priceGel} /></dd>
              </div>
              {r.discountGel > 0 && (
                <div className="flex justify-between text-success">
                  <dt>{d.requests.price.proDiscount}</dt>
                  <dd>−<Money gel={r.discountGel} /></dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 font-medium">
                <dt className="text-fg">{d.requests.price.final}</dt>
                <dd className="text-fg">{r.finalGel === 0 ? d.common.free : <Money gel={r.finalGel} />}</dd>
              </div>
              {r.usedFreeCredit && <p className="text-xs text-success">{d.requests.price.freeCredit}</p>}
              {payment?.status === "SUCCEEDED" && <p className="text-xs text-success">✓ {d.requests.paid}</p>}
            </dl>
            {unpaid && (
              <div className="px-5 pb-5">
                <ActionButton action={resumePaymentAction.bind(null, payment.id)} className="w-full">
                  {d.orders.pay}
                </ActionButton>
              </div>
            )}
          </Card>
          <div className="grid gap-2">
            <ButtonLink href={`/dashboard/messages?new=1&related=request:${r.id}`} variant="secondary" icon={<MessageSquare className="size-4" />}>
              {d.requests.discuss}
            </ButtonLink>
            {cancellable && (
              <ActionButton action={cancelRequestAction.bind(null, r.id)} variant="danger" confirm={`${d.requests.cancelRequest}?`}>
                {d.requests.cancelRequest}
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
