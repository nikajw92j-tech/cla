import type { Metadata } from "next";
import { Check, Crown, PartyPopper } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, isProActive } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { fmt } from "@/lib/i18n/format";
import { formatGel } from "@/lib/currency";
import { Card, CardHeader, FormattedDate, Money, PageHeader, ProBadge, ProgressRing, StatusBadge } from "@/components/ui/misc";
import { ActionButton } from "@/components/dashboard/action-button";
import { ButtonLink } from "@/components/ui/button";
import { cancelProAction, resumeProAction, subscribeProAction } from "@/app/actions/account";
import { SubscribeButton } from "./subscribe-button";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.pro.title };
}

export default async function DashboardPro({ searchParams }: { searchParams: Promise<{ activated?: string }> }) {
  const { activated } = await searchParams;
  const user = await requireUser();
  const { d } = await getI18n();
  const settings = await getSettings();
  const active = isProActive(user);
  const m = user.membership;
  const left = m ? Math.max(0, m.freeModsTotal - m.freeModsUsed) : 0;
  const total = m?.freeModsTotal ?? settings.pro.freeMods;
  const savedWithPro = active
    ? (await db.modificationRequest.aggregate({ where: { userId: user.id, wasPro: true, status: { not: "CANCELLED" } }, _sum: { discountGel: true } }))._sum.discountGel ?? 0
    : 0;

  return (
    <>
      {activated && active && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#f5b544]/40 bg-[#f5b544]/10 px-5 py-4">
          <PartyPopper className="size-6 shrink-0 text-gold" />
          <p className="font-medium text-fg">{d.success.proActivated}</p>
        </div>
      )}
      <PageHeader title={d.pro.title} subtitle={d.pro.subtitle} actions={active ? <ProBadge className="text-xs" /> : undefined} />

      {active && m ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[#f5b544]/20 blur-3xl" />
            <div className="relative flex flex-col items-center p-8 text-center">
              <ProgressRing value={(left / total) * 100} size={170} stroke={12}>
                <div>
                  <p className="font-display text-4xl font-semibold text-fg">{left}</p>
                  <p className="text-xs text-muted">/ {total}</p>
                </div>
              </ProgressRing>
              <p className="mt-6 text-lg font-semibold text-fg">{fmt(d.pro.freeRemaining, { left, total })}</p>
              {left === 0 && <p className="mt-2 text-sm text-muted">{fmt(d.pro.allUsed, { price: formatGel(settings.pro.proModPriceGel) })}</p>}
              <ButtonLink href="/dashboard/requests/new" className="mt-6">
                {d.dash.requestChange}
              </ButtonLink>
            </div>
          </Card>
          <Card>
            <CardHeader title={d.pro.active} action={<StatusBadge kind="pro" value={m.status} />} />
            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm text-muted">{d.common.price}</span>
                <span className="font-semibold text-fg">
                  <Money gel={m.priceGel} /> {d.common.perMonth}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="text-sm text-muted">{m.status === "CANCELLED" ? d.pro.endLabel : d.pro.renewLabel}</span>
                <span className="font-semibold text-fg">
                  <FormattedDate value={m.currentPeriodEnd} />
                </span>
              </div>
              {savedWithPro > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                  <span className="text-sm text-success">{d.pro.savingsTitle}</span>
                  <span className="font-semibold text-success">
                    <Money gel={savedWithPro} />
                  </span>
                </div>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {d.pro.perks.map((p) => (
                  <li key={p.title} className="flex items-start gap-2 text-sm text-fg-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={3} /> {p.title}
                  </li>
                ))}
              </ul>
              <div className="border-t border-line pt-5">
                {m.status === "CANCELLED" ? (
                  <ActionButton action={resumeProAction} variant="gold">
                    {d.pro.resume}
                  </ActionButton>
                ) : (
                  <ActionButton action={cancelProAction} variant="ghost" confirm={d.pro.cancelConfirm}>
                    {d.pro.cancel}
                  </ActionButton>
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader title={d.pro.perksTitle} />
            <ul className="grid gap-4 p-6 sm:grid-cols-2">
              {d.pro.perks.map((p) => (
                <li key={p.title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f5b544]/12 text-gold">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-fg">{p.title}</span>
                    <span className="block text-xs text-muted">{p.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <div className="relative overflow-hidden rounded-2xl border border-[#f5b544]/30 bg-[linear-gradient(160deg,#1a1408,#0d0b07)] p-8 text-white shadow-soft">
            <div className="absolute -top-20 -right-20 size-64 rounded-full bg-[#f5b544]/25 blur-3xl" />
            <Crown className="relative size-8 text-[#f7cf73]" />
            <p className="relative mt-4 font-display text-4xl font-semibold">
              <Money gel={settings.pro.priceGel} approx={false} />
              <span className="ml-2 font-sans text-base font-normal text-white/60">{d.common.perMonth}</span>
            </p>
            <p className="relative mt-3 text-white/70">{fmt(d.pro.savingsText, { standard: formatGel(settings.pro.modPriceGel * settings.pro.freeMods) })}</p>
            <SubscribeButton priceGel={settings.pro.priceGel} action={subscribeProAction} />
            <p className="relative mt-3 text-center text-xs text-white/50">{d.pro.cancelAnytime}</p>
          </div>
        </div>
      )}
    </>
  );
}
