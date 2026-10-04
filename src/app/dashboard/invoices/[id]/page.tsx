import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { formatGel, convert } from "@/lib/currency";
import { fmt, formatDate } from "@/lib/i18n/format";
import { safeJson } from "@/lib/utils";
import { getPackages } from "@/lib/content";
import { Logo } from "@/components/site/logo";
import { StatusBadge } from "@/components/ui/misc";
import { PrintButton } from "./print-button";
import type { Currency } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.invoices.number };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { d, locale } = await getI18n();
  // Admins may open any invoice (e.g. from the payments screen); customers only their own.
  const inv = await db.invoice.findFirst({ where: user.role === "ADMIN" ? { id } : { id, userId: user.id }, include: { payment: true, user: { include: { profile: true } } } });
  if (!inv) notFound();
  const [settings, packages] = await Promise.all([getSettings(), getPackages(locale)]);
  const items = safeJson<{ label: string; amountGel: number }[]>(inv.items, []);

  const label = (raw: string) => {
    const [kind, value] = raw.split(":");
    if (kind === "package") return packages.find((p) => p.slug === value)?.name ?? value;
    if (kind === "feature") return d.labels.feature[value as keyof typeof d.labels.feature] ?? value;
    if (kind === "modification") return `${d.invoices.purposes.MODIFICATION} ${value}`;
    if (kind === "pro") return d.invoices.proItem;
    return raw;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton label={d.common.print} />
      </div>
      <article className="print-sheet rounded-2xl border border-line bg-card-solid p-8 shadow-soft sm:p-12">
        <header className="flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted">
              Nexora Studio
              <br />
              {settings.contact.address}
              <br />
              {settings.contact.email}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-display text-2xl font-semibold text-fg">{d.invoices.number}</p>
            <p className="mt-1 font-mono text-sm text-fg-soft">{inv.number}</p>
            <p className="mt-2 text-sm text-muted">
              {d.invoices.issued}: {formatDate(inv.issuedAt, locale)}
            </p>
            <div className="mt-2">
              <StatusBadge kind="payment" value={inv.payment.status} />
            </div>
          </div>
        </header>
        <section className="mt-10">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">{d.invoices.billedTo}</p>
          <p className="mt-1 font-medium text-fg">
            {inv.user.firstName} {inv.user.lastName}
          </p>
          {inv.user.profile?.company && <p className="text-sm text-fg-soft">{inv.user.profile.company}</p>}
          <p className="text-sm text-muted">{inv.user.email}</p>
        </section>
        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2 font-medium">{d.invoices.description}</th>
              <th className="py-2 text-right font-medium">{d.invoices.amount}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-3 text-fg">{label(it.label)}</td>
                <td className="py-3 text-right text-fg">{formatGel(it.amountGel)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{d.invoices.subtotal}</dt>
            <dd className="text-fg">{formatGel(inv.subtotalGel)}</dd>
          </div>
          {inv.discountGel > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">{d.invoices.discount}</dt>
              <dd className="text-success">−{formatGel(inv.discountGel)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt className="text-fg">{d.common.total}</dt>
            <dd className="text-fg">{formatGel(inv.totalGel)}</dd>
          </div>
          {inv.currency !== "GEL" && (
            <p className="text-right text-xs text-muted">
              ≈ {convert(inv.totalGel, inv.currency as Currency, { USD: inv.rate, RUB: inv.rate })} {inv.currency} · {fmt(d.invoices.paidIn, { currency: inv.currency, rate: inv.rate })}
            </p>
          )}
        </dl>
        <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-muted">
          <p>{d.invoices.vat}</p>
          <p className="mt-1">{d.invoices.thanks}</p>
        </footer>
      </article>
    </div>
  );
}
