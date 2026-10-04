import { MessagesSquare } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/misc";

export default async function AdminMessagesIndex() {
  const { d } = await getI18n();
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[480px] items-center justify-center rounded-2xl border border-line bg-card backdrop-blur-xl">
      <EmptyState icon={<MessagesSquare />} title={d.messages.pick} />
    </div>
  );
}
