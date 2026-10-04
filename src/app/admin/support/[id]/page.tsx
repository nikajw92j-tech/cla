import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { TICKET_STATUSES } from "@/lib/catalog";
import { PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { TicketView } from "@/components/dashboard/ticket-view";
import { InlineForm } from "@/components/admin/inline-form";
import { replyTicketAction } from "@/app/actions/messaging";
import { adminTicketStatusAction } from "@/app/actions/admin";

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { d } = await getI18n();
  const t = await db.supportTicket.findUnique({ where: { id }, include: { user: true, replies: { orderBy: { createdAt: "asc" }, include: { author: true, files: true } } } });
  if (!t) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t.subject}
        subtitle={
          <>
            {t.number} · <T k={`labels.ticketCategory.${t.category}`} /> ·{" "}
            <Link href={`/admin/customers/${t.userId}`} className="text-brand hover:underline">
              {t.user.firstName} {t.user.lastName}
            </Link>
          </>
        }
        actions={<StatusBadge kind="ticket" value={t.status} />}
      />
      <div className="mb-6">
        <InlineForm action={adminTicketStatusAction.bind(null, t.id)} submitLabel={d.admin.updateStatus}>
          <select name="status" defaultValue={t.status} className="h-9 rounded-xl border border-line bg-elev px-3 text-sm">
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {d.status.ticket[s]}
              </option>
            ))}
          </select>
        </InlineForm>
      </div>
      <TicketView
        viewerIsStaff
        closed={false}
        reply={replyTicketAction.bind(null, t.id)}
        replies={t.replies.map((r) => ({
          id: r.id,
          body: r.body,
          staff: r.fromStaff,
          author: `${r.author.firstName} ${r.author.lastName}`,
          createdAt: r.createdAt.toISOString(),
          files: r.files.map(({ id, originalName, mimeType, size }) => ({ id, originalName, mimeType, size })),
        }))}
      />
    </div>
  );
}
