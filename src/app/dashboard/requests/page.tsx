import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Wand2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { REQUEST_STATUSES, isOneOf } from "@/lib/catalog";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, FormattedDate, Money, PageHeader, StatusBadge, T } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.requests.title };
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const user = await requireUser();
  const { d } = await getI18n();
  const filter = isOneOf(REQUEST_STATUSES, status) ? status : undefined;
  const [requests, counts] = await Promise.all([
    db.modificationRequest.findMany({ where: { userId: user.id, ...(filter ? { status: filter } : {}) }, orderBy: { createdAt: "desc" } }),
    db.modificationRequest.groupBy({ by: ["status"], where: { userId: user.id }, _count: true }),
  ]);
  const total = counts.reduce((s, c) => s + c._count, 0);

  return (
    <>
      <PageHeader
        title={d.requests.title}
        subtitle={d.requests.subtitle}
        actions={
          <ButtonLink href="/dashboard/requests/new" icon={<Plus className="size-4" />}>
            {d.dash.requestChange}
          </ButtonLink>
        }
      />
      {total > 0 && (
        <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip href="/dashboard/requests" active={!filter} label={d.common.all} count={total} />
          {REQUEST_STATUSES.map((s) => {
            const c = counts.find((x) => x.status === s)?._count ?? 0;
            return c ? <FilterChip key={s} href={`/dashboard/requests?status=${s}`} active={filter === s} label={d.status.request[s]} count={c} /> : null;
          })}
        </div>
      )}
      <Card>
        {requests.length === 0 ? (
          <EmptyState
            icon={<Wand2 />}
            title={d.requests.empty}
            action={
              <ButtonLink href="/dashboard/requests/new" icon={<Wand2 className="size-4" />}>
                {d.requests.emptyCta}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/dashboard/requests/${r.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-fg/[0.02] sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.number} · <T k={`labels.category.${r.category}`} /> · <FormattedDate value={r.createdAt} />
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge kind="request" value={r.status} />
                    <span className="w-20 text-right text-sm font-medium text-fg">{r.finalGel === 0 ? <span className="text-success">{d.common.free}</span> : <Money gel={r.finalGel} />}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} className={cn("flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors", active ? "border-brand bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong")}>
      {label}
      <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-white/20" : "bg-fg/[0.06]")}>{count}</span>
    </Link>
  );
}
