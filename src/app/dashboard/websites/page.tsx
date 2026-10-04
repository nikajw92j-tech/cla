import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, Globe2, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/misc";
import { StageTracker } from "@/components/dashboard/widgets";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.websites.title };
}

export default async function WebsitesPage() {
  const user = await requireUser();
  const { d } = await getI18n();
  const sites = await db.website.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <>
      <PageHeader title={d.websites.title} subtitle={d.websites.subtitle} />
      {sites.length === 0 ? (
        <Card>
          <EmptyState icon={<Globe2 />} title={d.websites.empty} action={<ButtonLink href="/dashboard/orders/new" iconRight={<ArrowRight className="size-4" />}>{d.websites.emptyCta}</ButtonLink>} />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sites.map((s) => (
            <Card key={s.id} hover className="overflow-hidden">
              <Link href={`/dashboard/websites/${s.id}`} className="block p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-fg">{s.name}</h2>
                    <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                      {s.url ? (
                        <>
                          <ExternalLink className="size-3.5" /> {s.url.replace(/^https?:\/\//, "")}
                        </>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge kind="website" value={s.status} />
                    {s.managed && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <ShieldCheck className="size-3.5 text-success" /> {d.websites.managed}
                      </span>
                    )}
                  </div>
                </div>
                <StageTracker stage={s.stage} progress={s.progress} eta={s.estimatedCompletion} compact />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
