import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getPackages } from "@/lib/content";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, FormattedDate, Money, PageHeader, StatusBadge } from "@/components/ui/misc";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.orders.title };
}

export default async function OrdersPage() {
  const user = await requireUser();
  const { d, locale } = await getI18n();
  const [orders, packages] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { package: true } }),
    getPackages(locale),
  ]);
  const pkgName = (slug?: string) => packages.find((p) => p.slug === slug)?.name ?? "—";

  return (
    <>
      <PageHeader
        title={d.orders.title}
        subtitle={d.orders.subtitle}
        actions={
          <ButtonLink href="/dashboard/orders/new" icon={<Plus className="size-4" />}>
            {d.dash.orderNew}
          </ButtonLink>
        }
      />
      <Card>
        {orders.length === 0 ? (
          <EmptyState icon={<Package />} title={d.orders.empty} action={<ButtonLink href="/dashboard/orders/new" iconRight={<ArrowRight className="size-4" />}>{d.orders.emptyCta}</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={o.status === "DRAFT" ? `/dashboard/orders/new?draft=${o.id}` : `/dashboard/orders/${o.id}`}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-fg/[0.02] sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{o.brandName || pkgName(o.package?.slug)}</p>
                    <p className="text-xs text-muted">
                      {o.number} · {pkgName(o.package?.slug)} · <FormattedDate value={o.updatedAt} />
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge kind="order" value={o.status} />
                    <span className="w-24 text-right font-medium text-fg">{o.totalGel ? <Money gel={o.totalGel} /> : "—"}</span>
                    <span className="hidden text-sm font-medium text-brand sm:inline">{o.status === "DRAFT" ? d.orders.continueDraft : d.common.view} →</span>
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
