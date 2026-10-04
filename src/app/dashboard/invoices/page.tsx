import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { Card, EmptyState, FormattedDate, Money, PageHeader, StatusBadge, T } from "@/components/ui/misc";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.invoices.title };
}

export default async function InvoicesPage() {
  const user = await requireUser();
  const { d } = await getI18n();
  const invoices = await db.invoice.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" }, include: { payment: true } });
  return (
    <>
      <PageHeader title={d.invoices.title} subtitle={d.invoices.subtitle} />
      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState icon={<FileText />} title={d.invoices.empty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">{d.invoices.number}</th>
                  <th className="px-5 py-3 font-medium">{d.invoices.description}</th>
                  <th className="px-5 py-3 font-medium">{d.common.date}</th>
                  <th className="px-5 py-3 font-medium">{d.common.status}</th>
                  <th className="px-5 py-3 text-right font-medium">{d.invoices.amount}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-fg/[0.02]">
                    <td className="px-5 py-3.5 font-medium text-fg">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-brand">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-fg-soft">
                      <T k={`invoices.purposes.${inv.payment.purpose}`} />
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      <FormattedDate value={inv.issuedAt} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge kind="payment" value={inv.payment.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-fg">
                      <Money gel={inv.totalGel} approx={false} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="inline-flex items-center gap-1 text-brand hover:underline" aria-label={d.common.download}>
                        <Download className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
