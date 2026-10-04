import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Eye, MessageSquare, Wand2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { safeJson } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, FormattedDate, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { FileList, StageTracker } from "@/components/dashboard/widgets";
import { ReviewForm } from "./review-form";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.websites.title };
}

export default async function WebsiteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { d } = await getI18n();
  const site = await db.website.findFirst({
    where: { id, userId: user.id },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
      files: { orderBy: { createdAt: "desc" } },
      requests: { orderBy: { createdAt: "desc" }, take: 5 },
      reviews: { where: { userId: user.id } },
      order: { include: { package: true } },
    },
  });
  if (!site) notFound();

  return (
    <>
      <PageHeader
        title={site.name}
        subtitle={site.url ?? undefined}
        actions={
          <>
            {site.url && (
              <ButtonLink href={site.url} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" icon={<ExternalLink className="size-4" />}>
                {d.websites.visit}
              </ButtonLink>
            )}
            {site.previewUrl && (
              <ButtonLink href={site.previewUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" icon={<Eye className="size-4" />}>
                {d.websites.preview}
              </ButtonLink>
            )}
            <ButtonLink href={`/dashboard/requests/new?website=${site.id}`} size="sm" icon={<Wand2 className="size-4" />}>
              {d.websites.requestChange}
            </ButtonLink>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.dash.projectProgress} action={<StatusBadge kind="website" value={site.status} />} />
            <div className="p-5">
              <StageTracker stage={site.stage} progress={site.progress} eta={site.estimatedCompletion} />
            </div>
          </Card>
          <Card>
            <CardHeader title={d.websites.files} />
            <div className="p-5">{site.files.length ? <FileList files={site.files} /> : <p className="text-sm text-muted">{d.websites.noFiles}</p>}</div>
          </Card>
          {site.stage === "COMPLETED" && (
            <Card>
              <CardHeader title={d.websites.reviewTitle} />
              <div className="p-5">
                {site.reviews.length ? (
                  <p className="text-sm text-muted">{d.websites.reviewPending}</p>
                ) : (
                  <ReviewForm websiteId={site.id} defaultName={`${user.firstName} ${user.lastName.charAt(0)}.`} defaultType={site.order?.websiteType ? d.labels.websiteType[site.order.websiteType as keyof typeof d.labels.websiteType] : ""} />
                )}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title={d.websites.history} />
            {site.activities.length === 0 ? (
              <EmptyState icon={<Eye />} title={d.dash.noActivity} />
            ) : (
              <ol className="p-5">
                {site.activities.map((a, i) => (
                  <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < site.activities.length - 1 && <span className="absolute top-5 bottom-0 left-[5px] w-px bg-line" />}
                    <span className="relative mt-1.5 size-3 shrink-0 rounded-full bg-gradient-brand" />
                    <div>
                      <p className="text-sm text-fg">
                        <T k={`activity.${a.kind}`} params={safeJson(a.params, {})} />
                      </p>
                      <p className="text-xs text-muted">
                        <FormattedDate value={a.createdAt} opts={{ dateStyle: "medium", timeStyle: "short" }} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <Card>
            <CardHeader title={d.requests.title} />
            <ul className="divide-y divide-line">
              {site.requests.map((r) => (
                <li key={r.id}>
                  <a href={`/dashboard/requests/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-fg/[0.02]">
                    <span className="truncate text-sm text-fg">{r.title}</span>
                    <StatusBadge kind="request" value={r.status} />
                  </a>
                </li>
              ))}
              {site.requests.length === 0 && <li className="px-5 py-4 text-sm text-muted">{d.requests.empty}</li>}
            </ul>
          </Card>
          <ButtonLink href={`/dashboard/messages?new=1&related=website:${site.id}`} variant="secondary" className="w-full" icon={<MessageSquare className="size-4" />}>
            {d.requests.discuss}
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
