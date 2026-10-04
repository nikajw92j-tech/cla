import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { ChatView } from "@/components/dashboard/chat";
import { sendMessageAction } from "@/app/actions/messaging";

export default async function AdminThread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const { d } = await getI18n();
  const thread = await db.thread.findUnique({
    where: { id },
    include: { user: true, website: true, order: true, request: true, messages: { orderBy: { createdAt: "asc" }, include: { files: true, sender: { include: { profile: true } } } } },
  });
  if (!thread) notFound();
  if (thread.unreadByAdmin) await db.thread.update({ where: { id }, data: { unreadByAdmin: 0 } });
  const related = thread.website
    ? { href: `/admin/websites/${thread.website.id}`, label: thread.website.name }
    : thread.order
      ? { href: `/admin/orders/${thread.order.id}`, label: thread.order.number }
      : thread.request
        ? { href: `/admin/requests/${thread.request.id}`, label: thread.request.number }
        : null;
  return (
    <ChatView
      title={thread.subject}
      subtitle={
        <>
          <Link href={`/admin/customers/${thread.userId}`} className="text-brand hover:underline">
            {thread.user.firstName} {thread.user.lastName}
          </Link>
          {related && (
            <>
              {" · "}
              <Link href={related.href} className="hover:underline">
                {related.label}
              </Link>
            </>
          )}
        </>
      }
      backHref="/admin/messages"
      send={sendMessageAction.bind(null, thread.id)}
      messages={thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.fromStaff || m.senderId === admin.id,
        staff: m.fromStaff,
        senderName: m.fromStaff ? d.common.team : `${m.sender.firstName} ${m.sender.lastName}`,
        senderAvatar: m.sender.profile?.avatarFileId ? `/api/files/${m.sender.profile.avatarFileId}` : null,
        createdAt: m.createdAt.toISOString(),
        files: m.files.map(({ id, originalName, mimeType, size }) => ({ id, originalName, mimeType, size })),
      }))}
    />
  );
}
