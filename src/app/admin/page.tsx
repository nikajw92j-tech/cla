import Link from "next/link";
import { Crown, DollarSign, Percent, Rocket, TrendingUp, Users, Wand2 } from "lucide-react";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { getPackages } from "@/lib/content";
import { formatDate } from "@/lib/i18n/format";
import { Card, CardHeader, FormattedDate, Money, PageHeader, StatusBadge } from "@/components/ui/misc";
import { StatCard } from "@/components/dashboard/widgets";
import { BarList, MoneyChart } from "@/components/admin/charts";
import { REQUEST_STATUSES } from "@/lib/catalog";

export default async function AdminAnalytics() {
  const { d, locale } = await getI18n();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [total, monthly, customers, activeProjects, proMembers, requests, payingCustomers, payments, ordersByPkg, reqByStatus, recentOrders, packages] = await Promise.all([
    db.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountGel: true } }),
    db.payment.aggregate({ where: { status: "SUCCEEDED", paidAt: { gte: monthStart } }, _sum: { amountGel: true } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.website.count({ where: { stage: { not: "COMPLETED" } } }),
    db.proMembership.count({ where: { status: { not: "EXPIRED" }, currentPeriodEnd: { gt: now } } }),
    db.modificationRequest.count(),
    db.user.count({ where: { role: "CUSTOMER", payments: { some: { status: "SUCCEEDED", purpose: "ORDER" } } } }),
    db.payment.findMany({ where: { status: "SUCCEEDED", paidAt: { gte: sixMonthsAgo } }, select: { amountGel: true, paidAt: true } }),
    db.order.groupBy({ by: ["packageId"], where: { status: { notIn: ["DRAFT", "CANCELLED"] } }, _count: true }),
    db.modificationRequest.groupBy({ by: ["status"], _count: true }),
    db.order.findMany({ where: { status: { not: "DRAFT" } }, orderBy: { createdAt: "desc" }, take: 6, include: { user: true } }),
    getPackages(locale),
  ]);

  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const revenue = months.map((m) => ({
    label: formatDate(m, locale, { month: "short" }),
    value: payments.filter((p) => p.paidAt && p.paidAt.getFullYear() === m.getFullYear() && p.paidAt.getMonth() === m.getMonth()).reduce((s, p) => s + p.amountGel, 0),
  }));
  const pkgRows = await db.package.findMany({ select: { id: true, slug: true } });
  const byPackage = packages.map((p) => ({ label: p.name, value: ordersByPkg.find((o) => o.packageId === pkgRows.find((r) => r.slug === p.slug)?.id)?._count ?? 0 }));
  const byStatus = REQUEST_STATUSES.map((s) => ({ label: d.status.request[s], value: reqByStatus.find((r) => r.status === s)?._count ?? 0 }));
  const conversion = customers ? Math.round((payingCustomers / customers) * 1000) / 10 : 0;
  const s = d.admin.stats;

  return (
    <>
      <PageHeader title={d.admin.nav.analytics} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label={s.totalRevenue} value={<Money gel={total._sum.amountGel ?? 0} />} icon={<DollarSign />} accent="green" />
        <StatCard index={1} label={s.monthlyRevenue} value={<Money gel={monthly._sum.amountGel ?? 0} />} icon={<TrendingUp />} />
        <StatCard index={2} label={s.customers} value={customers} icon={<Users />} href="/admin/customers" accent="pink" />
        <StatCard index={3} label={s.activeProjects} value={activeProjects} icon={<Rocket />} href="/admin/websites" />
        <StatCard index={4} label={s.proMembers} value={proMembers} icon={<Crown />} accent="gold" href="/admin/memberships" />
        <StatCard index={5} label={s.requests} value={requests} icon={<Wand2 />} href="/admin/requests" />
        <StatCard index={6} label={s.conversion} value={`${conversion}%`} icon={<Percent />} accent="green" hint={s.conversionHint} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title={d.admin.revenueChart} />
          <div className="p-5">
            <MoneyChart data={revenue} title={d.admin.revenueChart} />
          </div>
        </Card>
        <Card>
          <CardHeader title={d.admin.ordersChart} />
          <div className="p-5">
            <BarList data={byPackage} title={d.admin.ordersChart} />
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader title={d.admin.requestsChart} />
          <div className="p-5">
            <BarList data={byStatus} title={d.admin.requestsChart} />
          </div>
        </Card>
        <Card>
          <CardHeader title={d.admin.nav.orders} action={<Link href="/admin/orders" className="text-sm font-medium text-brand hover:underline">{d.common.viewAll}</Link>} />
          <ul className="divide-y divide-line">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-fg/[0.02]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{o.brandName ?? o.number}</p>
                    <p className="text-xs text-muted">
                      {o.user.firstName} {o.user.lastName} · <FormattedDate value={o.createdAt} relative />
                    </p>
                  </div>
                  <StatusBadge kind="order" value={o.status} />
                  <span className="w-20 text-right text-sm font-medium"><Money gel={o.totalGel} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
