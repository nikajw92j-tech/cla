import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { ChatView } from "@/components/dashboard/chat";
import { sendMessageAction } from "@/app/actions/messaging";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { d } = await getI18n();
  const thread = await db.thread.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { files: true, sender: { include: { profile: true } } } },
      website: true,
      order: true,
      request: true,
    },
  });
  if (!thread) notFound();
  if (thread.unreadByUser) await db.thread.update({ where: { id }, data: { unreadByUser: 0 } });
  const settings = await getSettings();

  const link = thread.website
    ? { href: `/dashboard/websites/${thread.website.id}`, label: thread.website.name }
    : thread.order
      ? { href: `/dashboard/orders/${thread.order.id}`, label: thread.order.brandName ?? thread.order.number }
      : thread.request
        ? { href: `/dashboard/requests/${thread.request.id}`, label: `${thread.request.number} — ${thread.request.title}` }
        : null;

  return (
    <ChatView
      title={thread.subject}
      subtitle={
        link ? (
          <Link href={link.href} className="text-brand hover:underline">
            {d.messages.relatedTo}: {link.label}
          </Link>
        ) : undefined
      }
      backHref="/dashboard/messages"
      responseHours={settings.stats.responseHours}
      send={sendMessageAction.bind(null, thread.id)}
      messages={thread.messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === user.id,
        staff: m.fromStaff,
        senderName: m.fromStaff ? d.common.team : `${m.sender.firstName} ${m.sender.lastName}`,
        senderAvatar: !m.fromStaff && m.sender.profile?.avatarFileId ? `/api/files/${m.sender.profile.avatarFileId}` : null,
        createdAt: m.createdAt.toISOString(),
        files: m.files.map(({ id, originalName, mimeType, size }) => ({ id, originalName, mimeType, size })),
      }))}
    />
  );
}
