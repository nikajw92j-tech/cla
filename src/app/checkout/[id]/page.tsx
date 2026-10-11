import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, XCircle, FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { Logo } from "@/components/site/logo";
import { Money, T } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { ActionButton } from "@/components/dashboard/action-button";
import { completeTestPaymentAction } from "@/app/actions/account";
import { testCheckoutEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

/**
 * Hosted-checkout simulator used by the built-in "test" payment provider.
 * In production this page is replaced by your gateway's hosted payment page.
 */
export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }) {
  if (!testCheckoutEnabled) notFound();
  const { id } = await params;
  const { status } = await searchParams;
  const user = await requireUser();
  const { d } = await getI18n();
  const payment = await db.payment.findFirst({ where: { id, userId: user.id }, include: { invoice: true, order: true, request: true } });
  if (!payment) notFound();

  const back = payment.purpose === "PRO" ? "/dashboard/pro" : payment.purpose === "ORDER" ? `/dashboard/orders/${payment.orderId}` : `/dashboard/requests/${payment.requestId}`;

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="glass overflow-hidden rounded-3xl shadow-soft">
          <div className="flex items-center gap-2 border-b border-line bg-warning/10 px-6 py-3 text-xs font-medium text-warning">
            <FlaskConical className="size-4" /> {d.checkout.testMode}
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm text-muted">
              <T k={`invoices.purposes.${payment.purpose}`} /> · {payment.invoice?.number}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-fg">
              <Money gel={payment.amountGel} approx={false} />
            </p>
            {payment.currency !== "GEL" && <p className="mt-1 text-xs text-muted">{d.common.approxNote}</p>}

            {status === "failed" || payment.status === "FAILED" ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                <XCircle className="size-5 shrink-0" /> {d.status.payment.FAILED}
              </div>
            ) : null}

            {payment.status === "PENDING" ? (
              <div className="mt-8 space-y-3">
                <ActionButton action={completeTestPaymentAction.bind(null, payment.id, "approve")} size="lg" className="w-full">
                  {d.checkout.pay} · <Money gel={payment.amountGel} approx={false} />
                </ActionButton>
                <ActionButton action={completeTestPaymentAction.bind(null, payment.id, "decline")} variant="ghost" className="w-full">
                  {d.common.cancel}
                </ActionButton>
              </div>
            ) : (
              <ButtonLink href={back} className="mt-8 w-full" size="lg">
                {d.common.back}
              </ButtonLink>
            )}
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-4" /> {d.wizard.s6.secure}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
