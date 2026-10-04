import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { ThreadList } from "@/components/dashboard/chat";
import { ButtonLink } from "@/components/ui/button";
import { MessagesPane } from "./pane";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { d } = await getI18n();
  const threads = await db.thread.findMany({
    where: { userId: user.id },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <MessagesPane
        list={
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h1 className="font-semibold text-fg">{d.messages.title}</h1>
              <ButtonLink href="/dashboard/messages?new=1" size="sm" variant="ghost" icon={<Plus className="size-4" />} aria-label={d.messages.newThread} />
            </div>
            <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
              <ThreadList
                base="/dashboard/messages"
                newHref="/dashboard/messages?new=1"
                threads={threads.map((t) => ({ id: t.id, subject: t.subject, preview: t.messages[0]?.body ?? "", at: t.lastMessageAt.toISOString(), unread: t.unreadByUser }))}
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
