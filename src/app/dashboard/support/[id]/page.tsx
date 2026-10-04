import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { TicketView } from "@/components/dashboard/ticket-view";
import { ActionButton } from "@/components/dashboard/action-button";
import { closeTicketAction, replyTicketAction } from "@/app/actions/messaging";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.support.title };
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { d } = await getI18n();
  const ticket = await db.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: { replies: { orderBy: { createdAt: "asc" }, include: { author: true, files: true } } },
  });
  if (!ticket) notFound();
  const closed = ticket.status === "CLOSED";
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={ticket.subject}
        subtitle={
          <>
            {ticket.number} · <T k={`labels.ticketCategory.${ticket.category}`} />
          </>
        }
        actions={
          <>
            <StatusBadge kind="ticket" value={ticket.status} />
            {!closed && (
              <ActionButton action={closeTicketAction.bind(null, ticket.id)} variant="ghost" size="sm">
                {d.support.close}
              </ActionButton>
            )}
          </>
        }
      />
      <TicketView
        viewerIsStaff={false}
        closed={closed}
        reply={replyTicketAction.bind(null, ticket.id)}
        replies={ticket.replies.map((r) => ({
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
