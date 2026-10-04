import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { REQUEST_STATUSES } from "@/lib/catalog";
import { Badge, Card, CardHeader, FormattedDate, Money, PageHeader, ProBadge, StatusBadge, T } from "@/components/ui/misc";
import { FileList, RequestTimeline } from "@/components/dashboard/widgets";
import { InlineForm } from "@/components/admin/inline-form";
import { adminUpdateRequestAction } from "@/app/actions/admin";

export default async function AdminRequest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { d } = await getI18n();
  const r = await db.modificationRequest.findUnique({ where: { id }, include: { user: true, files: true, events: { orderBy: { createdAt: "asc" } }, payments: true } });
  if (!r) notFound();
  const paid = r.finalGel === 0 || r.payments.some((p) => p.status === "SUCCEEDED");
  return (
    <>
      <PageHeader
        title={r.title}
        subtitle={
          <>
            {r.number} ·{" "}
            <Link href={`/admin/customers/${r.userId}`} className="text-brand hover:underline">
              {r.user.firstName} {r.user.lastName}
            </Link>{" "}
            · <FormattedDate value={r.createdAt} opts={{ dateStyle: "medium", timeStyle: "short" }} />
          </>
        }
        actions={
          <>
            {r.wasPro && <ProBadge />}
            <StatusBadge kind="request" value={r.status} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={d.common.details} />
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="violet"><T k={`labels.category.${r.category}`} /></Badge>
              <Badge tone={r.priority === "URGENT" ? "red" : "gray"}><T k={`labels.priority.${r.priority}`} /></Badge>
              <Badge tone={paid ? "green" : "amber"}>{paid ? d.requests.paid : d.status.payment.PENDING}</Badge>
              <span className="text-sm"><Money gel={r.finalGel} approx={false} /></span>
            </div>
            <a href={r.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              {r.websiteUrl} <ExternalLink className="size-3.5" />
            </a>
            <p className="whitespace-pre-line text-fg-soft">{r.description}</p>
            {r.notes && <p className="rounded-xl border border-line p-3 text-sm whitespace-pre-line text-fg-soft">{r.notes}</p>}
            <FileList files={r.files} />
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.admin.updateStatus} />
            <div className="p-5">
              <InlineForm action={adminUpdateRequestAction.bind(null, r.id)} submitLabel={d.common.save} stacked>
                <select name="status" defaultValue={r.status} className="h-10 w-full rounded-xl border border-line bg-elev px-3 text-sm">
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {d.status.request[s]}
                    </option>
                  ))}
                </select>
                <textarea name="note" rows={2} placeholder={d.admin.note} className="w-full rounded-xl border border-line bg-elev px-3 py-2 text-sm" maxLength={1000} />
              </InlineForm>
            </div>
          </Card>
          <Card>
            <CardHeader title={d.requests.timeline.title} />
            <div className="p-5">
              <RequestTimeline status={r.status} events={r.events} />
              <ul className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs text-muted">
                {r.events.map((e) => (
                  <li key={e.id}>
                    <FormattedDate value={e.createdAt} opts={{ dateStyle: "short", timeStyle: "short" }} /> — <T k={`status.request.${e.status}`} />
                    {e.note && e.note !== "payment" && e.note !== "customer-confirmed" ? `: ${e.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
