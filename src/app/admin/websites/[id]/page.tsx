import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { Card, CardHeader, PageHeader, StatusBadge } from "@/components/ui/misc";
import { FileList, StageTracker } from "@/components/dashboard/widgets";
import { WebsiteEditor, PreviewUpload } from "./editor";

export default async function AdminWebsite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { d } = await getI18n();
  const s = await db.website.findUnique({ where: { id }, include: { user: true, files: { orderBy: { createdAt: "desc" } } } });
  if (!s) notFound();
  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={
          <Link href={`/admin/customers/${s.userId}`} className="text-brand hover:underline">
            {s.user.firstName} {s.user.lastName}
          </Link>
        }
        actions={<StatusBadge kind="website" value={s.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title={d.common.edit} />
          <div className="p-5">
            <WebsiteEditor
              id={s.id}
              defaults={{
                name: s.name,
                stage: s.stage,
                progress: s.progress,
                status: s.status,
                url: s.url ?? "",
                previewUrl: s.previewUrl ?? "",
                eta: s.estimatedCompletion ? s.estimatedCompletion.toISOString().slice(0, 10) : "",
                managed: s.managed,
              }}
            />
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.dash.projectProgress} />
            <div className="p-5">
              <StageTracker stage={s.stage} progress={s.progress} eta={s.estimatedCompletion} compact />
            </div>
          </Card>
          <Card>
            <CardHeader title={d.admin.uploadPreview} />
            <div className="space-y-4 p-5">
              <PreviewUpload id={s.id} />
              <FileList files={s.files} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
