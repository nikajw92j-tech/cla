import Link from "next/link";
import { ArrowRight, CheckCircle2, Crown, Globe2, Inbox, MessageSquare, Package, Plus, Sparkles, Wand2, Activity as ActivityIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, isProActive } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { fmt } from "@/lib/i18n/format";
import { formatGel } from "@/lib/currency";
import { safeJson } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, FormattedDate, PageHeader, ProgressBar, StatusBadge, T, Avatar } from "@/components/ui/misc";
import { StageTracker, StatCard } from "@/components/dashboard/widgets";

export default async function DashboardOverview() {
  const user = await requireUser();
  const { d } = await getI18n();
  const settings = await getSettings();
  const pro = isProActive(user);

  const [websites, activeOrders, openRequests, completedRequests, paidStandardMods, activities, threads, project] = await Promise.all([
    db.website.count({ where: { userId: user.id } }),
    db.order.count({ where: { userId: user.id, status: { in: ["PENDING_PAYMENT", "PAID", "IN_PROGRESS"] } } }),
    db.modificationRequest.count({ where: { userId: user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    db.modificationRequest.count({ where: { userId: user.id, status: "COMPLETED" } }),
    db.modificationRequest.findMany({ where: { userId: user.id, wasPro: false, status: { not: "CANCELLED" } }, select: { finalGel: true } }),
    db.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 7 }),
    db.thread.findMany({ where: { userId: user.id }, orderBy: { lastMessageAt: "desc" }, take: 4, include: { messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } } } }),
    db.website.findFirst({ where: { userId: user.id, stage: { not: "COMPLETED" } }, orderBy: { updatedAt: "desc" } }),
  ]);

  const m = user.membership;
  const creditsLeft = pro && m ? Math.max(0, m.freeModsTotal - m.freeModsUsed) : 0;
  const creditsTotal = m?.freeModsTotal ?? settings.pro.freeMods;
  // Honest savings: what they actually paid for standard requests vs. what Pro would have covered.
  const coveredByPro = Math.min(paidStandardMods.length, settings.pro.freeMods);
  const savings = paidStandardMods.slice(0, coveredByPro).reduce((s, r) => s + r.finalGel, 0);

  return (
    <>
      <PageHeader
        title={fmt(d.dash.greeting, { name: user.firstName })}
        subtitle={d.dash.greetingSub}
        actions={
          <>
            <ButtonLink href="/dashboard/orders/new" variant="secondary" icon={<Plus className="size-4" />}>
              {d.dash.orderNew}
            </ButtonLink>
            <ButtonLink href="/dashboard/requests/new" size="lg" icon={<Wand2 className="size-[18px]" />}>
              {d.dash.requestChange}
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard index={0} label={d.dash.stats.activeWebsites} value={websites} icon={<Globe2 />} href="/dashboard/websites" />
        <StatCard index={1} label={d.dash.stats.activeOrders} value={activeOrders} icon={<Package />} href="/dashboard/orders" accent="pink" />
        <StatCard index={2} label={d.dash.stats.openRequests} value={openRequests} icon={<Inbox />} href="/dashboard/requests" />
        <StatCard index={3} label={d.dash.stats.completedRequests} value={completedRequests} icon={<CheckCircle2 />} accent="green" href="/dashboard/requests" />
        <StatCard index={4} label={d.dash.stats.proStatus} value={pro ? <span className="text-gradient">PRO</span> : <span className="text-xl text-muted">{d.dash.stats.notPro}</span>} icon={<Crown />} accent="gold" href="/dashboard/pro" hint={pro && m ? <><T k="status.pro.ACTIVE" /> · <FormattedDate value={m.currentPeriodEnd} /></> : undefined} />
        <StatCard index={5} label={d.dash.stats.freeLeft} value={pro ? `${creditsLeft}/${creditsTotal}` : "—"} icon={<Sparkles />} accent="gold" href="/dashboard/pro">
          {pro ? (
            <>
              <ProgressBar value={(creditsLeft / creditsTotal) * 100} tone="gold" className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted">{fmt(d.pro.freeRemaining, { left: creditsLeft, total: creditsTotal })}</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted">{d.dash.proCard.text}</p>
          )}
        </StatCard>
      </div>

      {!pro && paidStandardMods.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#f5b544]/30 bg-[linear-gradient(110deg,color-mix(in_oklab,#f5b544_10%,var(--card-solid)),var(--card-solid))] p-5 sm:flex-row sm:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f5b544]/15 text-[#d99a2b] dark:text-[#f7cf73]">
            <Crown className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-fg">{fmt(d.dash.proUpsell.title, { n: paidStandardMods.length })}</p>
            <p className="text-sm text-muted">{fmt(d.dash.proUpsell.text, { amount: formatGel(savings) })}</p>
          </div>
          <ButtonLink href="/pro" variant="gold" size="sm" iconRight={<ArrowRight className="size-4" />}>
            {d.dash.proUpsell.button}
          </ButtonLink>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title={d.dash.projectProgress}
            subtitle={project?.name}
            action={project && <StatusBadge kind="website" value={project.status} />}
          />
          <div className="p-5">
            {project ? (
              <>
                <StageTracker stage={project.stage} progress={project.progress} eta={project.estimatedCompletion} />
                <div className="mt-6 flex justify-end">
                  <ButtonLink href={`/dashboard/websites/${project.id}`} variant="ghost" size="sm" iconRight={<ArrowRight className="size-4" />}>
                    {d.common.details}
                  </ButtonLink>
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Globe2 />}
                title={d.websites.empty}
                action={
                  <ButtonLink href="/dashboard/orders/new" iconRight={<ArrowRight className="size-4" />}>
                    {d.websites.emptyCta}
                  </ButtonLink>
                }
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={d.dash.latestMessages} action={<Link href="/dashboard/messages" className="text-sm font-medium text-brand hover:underline">{d.common.viewAll}</Link>} />
          {threads.length === 0 ? (
            <EmptyState icon={<MessageSquare />} title={d.dash.noMessages} action={<ButtonLink href="/dashboard/messages?new=1" size="sm" variant="secondary">{d.dash.startConversation}</ButtonLink>} />
          ) : (
            <ul className="divide-y divide-line">
              {threads.map((t) => {
                const last = t.messages[0];
                return (
                  <li key={t.id}>
                    <Link href={`/dashboard/messages/${t.id}`} className="flex gap-3 px-5 py-4 transition-colors hover:bg-fg/[0.02]">
                      <Avatar name={last?.fromStaff ? "Nexora Team" : `${user.firstName} ${user.lastName}`} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-fg">{t.subject}</p>
                          <span className="shrink-0 text-xs text-muted">
                            <FormattedDate value={t.lastMessageAt} relative />
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted">{last?.body}</p>
                      </div>
                      {t.unreadByUser > 0 && <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title={d.dash.recentActivity} />
        {activities.length === 0 ? (
          <EmptyState icon={<ActivityIcon />} title={d.dash.noActivity} />
        ) : (
          <ol className="relative p-5">
            {activities.map((a, i) => (
              <li key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < activities.length - 1 && <span className="absolute top-6 bottom-0 left-[7px] w-px bg-line" />}
                <span className="relative mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-brand bg-card-solid" />
                <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm text-fg">
                    <T k={`activity.${a.kind}`} params={safeJson(a.params, {})} />
                  </p>
                  <span className="text-xs text-muted">
                    <FormattedDate value={a.createdAt} relative />
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
