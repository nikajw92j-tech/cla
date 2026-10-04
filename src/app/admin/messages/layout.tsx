import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { ThreadList } from "@/components/dashboard/chat";
import { MessagesPane } from "@/app/dashboard/messages/pane";

export default async function AdminMessagesLayout({ children }: { children: React.ReactNode }) {
  const { d } = await getI18n();
  const threads = await db.thread.findMany({
    orderBy: [{ lastMessageAt: "desc" }],
    take: 200,
    include: { user: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <MessagesPane
        list={
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft backdrop-blur-xl">
            <div className="border-b border-line px-4 py-3">
              <h1 className="font-semibold text-fg">{d.admin.nav.messages}</h1>
            </div>
            <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
              <ThreadList
                base="/admin/messages"
                threads={threads.map((t) => ({
                  id: t.id,
                  subject: t.subject,
                  who: `${t.user.firstName} ${t.user.lastName}`,
                  preview: t.messages[0]?.body ?? "",
                  at: t.lastMessageAt.toISOString(),
                  unread: t.unreadByAdmin,
                }))}
              />
            </div>
          </div>
        }
      >
        {children}
      </MessagesPane>
    </div>
  );
}
