import type { Metadata } from "next";
import { Gift, Trophy, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { fmt } from "@/lib/i18n/format";
import { formatGel } from "@/lib/currency";
import { appUrl } from "@/lib/utils";
import { Card, CardHeader, FormattedDate, Money, PageHeader, Badge } from "@/components/ui/misc";
import { StatCard } from "@/components/dashboard/widgets";
import { CopyField } from "@/components/dashboard/copy-field";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.referrals.title };
}

export default async function ReferralsPage() {
  const user = await requireUser();
  const { d } = await getI18n();
  const settings = await getSettings();
  let code = await db.referralCode.findUnique({ where: { userId: user.id } });
  if (!code) code = await db.referralCode.create({ data: { userId: user.id, code: `NX${user.id.slice(-6).toUpperCase()}` } });
  const referrals = await db.referral.findMany({ where: { referrerId: user.id }, include: { referredUser: true }, orderBy: { createdAt: "desc" } });
  const qualified = referrals.filter((r) => r.status === "QUALIFIED");
  const earned = qualified.reduce((s, r) => s + r.rewardGel, 0);

  return (
    <>
      <PageHeader title={d.referrals.title} subtitle={d.referrals.subtitle} />
      {!settings.referral.enabled && <p className="mb-6 rounded-xl border border-line bg-fg/[0.03] px-4 py-3 text-sm text-muted">{d.referrals.disabled}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label={d.referrals.successful} value={qualified.length} icon={<Trophy />} accent="green" />
        <StatCard index={1} label={d.referrals.pending} value={referrals.length - qualified.length} icon={<Users />} />
        <StatCard index={2} label={d.referrals.earned} value={<Money gel={earned} />} icon={<Gift />} accent="gold" />
      </div>
      <Card className="mt-6">
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-fg-soft">{d.referrals.code}</p>
            <CopyField value={code.code} mono large />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-fg-soft">{d.referrals.link}</p>
            <CopyField value={appUrl(`/register?ref=${code.code}`)} />
          </div>
          <p className="text-sm text-muted lg:col-span-2">{fmt(d.referrals.how, { pct: settings.referral.friendDiscountPct, reward: formatGel(settings.referral.rewardGel) })}</p>
        </div>
      </Card>
      {referrals.length > 0 && (
        <Card className="mt-6">
          <CardHeader title={d.referrals.successful} />
          <ul className="divide-y divide-line">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-fg">
                    {r.referredUser.firstName} {r.referredUser.lastName.charAt(0)}.
                  </p>
                  <p className="text-xs text-muted">
                    <FormattedDate value={r.createdAt} />
                  </p>
                </div>
                {r.status === "QUALIFIED" ? (
                  <Badge tone="green">
                    +<Money gel={r.rewardGel} />
                  </Badge>
                ) : (
                  <Badge tone="amber">{d.referrals.pending}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
