import "server-only";
import { db } from "@/lib/db";
import { notify, logActivity } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { appUrl, refNumber } from "@/lib/utils";
import { env } from "@/lib/env";
import { getLocale } from "@/lib/i18n/server";
import { bogConfigured, createBogOrder, getBogReceipt, type BogReceipt } from "@/lib/bog";

/**
 * Payment provider abstraction.
 * With BOG_CLIENT_ID / BOG_CLIENT_SECRET set, card payments go to Bank of Georgia's hosted
 * payment page and are confirmed by its signed callback (src/app/api/payments/bog/callback).
 * Without them, the "test" provider sends the customer to /checkout/[id], a simulator that is
 * disabled in production unless PAYMENTS_TEST_MODE=true. Card data never touches this app.
 */
export const testCheckoutEnabled = !bogConfigured && (!env.isProd || process.env.PAYMENTS_TEST_MODE === "true");

export const paymentProvider = {
  name: bogConfigured ? "bog" : "test",
  async createCheckout(paymentId: string) {
    if (bogConfigured) {
      const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { invoice: true } });
      const order = await createBogOrder({
        externalOrderId: payment.id,
        amountGel: payment.amountGel,
        description: payment.invoice?.number ?? payment.purpose,
        callbackUrl: appUrl("/api/payments/bog/callback"),
        successUrl: appUrl(`/api/payments/bog/return?payment=${payment.id}`),
        failUrl: appUrl(`/api/payments/bog/return?payment=${payment.id}`),
        language: (await getLocale()) === "ka" ? "ka" : "en",
      });
      await db.payment.update({ where: { id: payment.id }, data: { providerRef: order.id } });
      return { url: order.redirectUrl };
    }
    if (!testCheckoutEnabled) throw new Error("Card payments are not configured: set BOG_CLIENT_ID and BOG_CLIENT_SECRET");
    return { url: `/checkout/${paymentId}` };
  },
};

/** Where the customer lands after paying (or abandoning) a payment. */
export function paymentReturnPath(payment: { purpose: string; orderId: string | null; requestId: string | null }, succeeded: boolean) {
  if (payment.purpose === "PRO") return succeeded ? "/dashboard/pro?activated=1" : "/dashboard/pro";
  if (payment.purpose === "ORDER") return `/dashboard/orders/${payment.orderId}${succeeded ? "?success=1" : ""}`;
  return `/dashboard/requests/${payment.requestId}${succeeded ? "?new=1" : ""}`;
}

/**
 * Applies a BOG order's status to our payment. `receipt` must come from a verified callback or
 * from the receipt API, never from the browser. Returns the payment's resulting status.
 */
export async function applyBogReceipt(receipt: BogReceipt) {
  const paymentId = receipt.external_order_id;
  if (!paymentId) return null;
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  const status = receipt.order_status.key;
  if (status === "completed") {
    const paid = Number(receipt.purchase_units?.transfer_amount ?? receipt.purchase_units?.request_amount);
    if (!(paid >= payment.amountGel)) {
      console.error(`BOG order ${receipt.order_id}: paid ${paid} GEL, expected ${payment.amountGel} for payment ${payment.id}`);
      return payment.status;
    }
    await confirmPayment(payment.id, receipt.order_id);
    return "SUCCEEDED";
  }
  // A declined attempt only fails the payment if it is the latest checkout session for it.
  if (status === "rejected" && payment.providerRef === receipt.order_id) {
    await failPayment(payment.id);
    return "FAILED";
  }
  return payment.status;
}

/** Pulls the latest status of a payment's BOG order (used when the customer returns from the bank). */
export async function syncBogPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.providerRef || !bogConfigured) return payment?.status ?? null;
  if (payment.status !== "PENDING") return payment.status;
  return applyBogReceipt(await getBogReceipt(payment.providerRef));
}

type Purpose = "ORDER" | "MODIFICATION" | "PRO";

export async function createPayment(input: {
  userId: string;
  purpose: Purpose;
  amountGel: number;
  method: "CARD" | "BANK_TRANSFER";
  currency: string;
  rate: number;
  items: { label: string; amountGel: number }[];
  discountGel?: number;
  orderId?: string;
  requestId?: string;
}) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId: input.userId,
        purpose: input.purpose,
        amountGel: input.amountGel,
        method: input.method,
        currency: input.currency,
        rate: input.rate,
        orderId: input.orderId,
        requestId: input.requestId,
      },
    });
    const subtotal = input.items.reduce((s, i) => s + i.amountGel, 0);
    await tx.invoice.create({
      data: {
        number: refNumber(`INV-${new Date().getFullYear()}`),
        userId: input.userId,
        paymentId: payment.id,
        items: JSON.stringify(input.items),
        subtotalGel: subtotal,
        discountGel: input.discountGel ?? 0,
        totalGel: input.amountGel,
        currency: input.currency,
        rate: input.rate,
      },
    });
    return payment;
  });
}

/** Idempotently marks a payment as succeeded and fulfils what it paid for. */
export async function confirmPayment(paymentId: string, providerRef?: string) {
  const { count } = await db.payment.updateMany({
    // FAILED is included so money that arrives after a declined attempt is never ignored.
    where: { id: paymentId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "SUCCEEDED", paidAt: new Date(), providerRef },
  });
  if (count === 0) return false; // already processed
  const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { invoice: true } });
  if (payment.invoice) await db.invoice.update({ where: { id: payment.invoice.id }, data: { status: "PAID" } });

  if (payment.purpose === "ORDER" && payment.orderId) await fulfilOrder(payment.orderId);
  if (payment.purpose === "PRO") await activatePro(payment.userId, payment.amountGel);
  if (payment.purpose === "MODIFICATION" && payment.requestId) {
    await db.requestEvent.create({ data: { requestId: payment.requestId, status: "SUBMITTED", note: "payment" } });
  }
  if (payment.invoice) {
    await notify(payment.userId, "paymentConfirmed", { number: payment.invoice.number }, { link: "/dashboard/invoices", channel: "billing" });
  }
  return true;
}

export async function failPayment(paymentId: string) {
  await db.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "FAILED" } });
}

async function fulfilOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { package: true, website: true } });
  if (order.status === "PAID" || order.status === "IN_PROGRESS" || order.status === "COMPLETED") return;
  await db.order.update({ where: { id: orderId }, data: { status: "PAID" } });

  if (!order.website) {
    const days = order.package?.deliveryDays ?? 14;
    const website = await db.website.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        name: order.brandName || order.number,
        stage: "STARTED",
        progress: 20,
        managed: order.package?.slug === "ultimate",
        estimatedCompletion: new Date(Date.now() + days * 86400000),
      },
    });
    await logActivity(order.userId, "orderPaid", { number: order.number }, website.id);
  }
  if (order.discountCodeId) {
    await db.discountCode.update({ where: { id: order.discountCodeId }, data: { usedCount: { increment: 1 } } });
    await db.discountRedemption.create({ data: { codeId: order.discountCodeId, userId: order.userId, amountGel: order.discountGel } });
  }
  await notify(order.userId, "orderPaid", { number: order.number }, { link: `/dashboard/orders/${order.id}` });

  // Referral reward: first paid order of a referred customer qualifies the referral.
  const settings = await getSettings();
  const referral = await db.referral.findUnique({ where: { referredUserId: order.userId } });
  if (referral && referral.status === "PENDING" && settings.referral.enabled) {
    await db.referral.update({
      where: { id: referral.id },
      data: { status: "QUALIFIED", rewardGel: settings.referral.rewardGel, qualifiedAt: new Date() },
    });
    await notify(referral.referrerId, "referralQualified", { amount: `${settings.referral.rewardGel} ₾` }, { link: "/dashboard/referrals" });
  }
}

async function activatePro(userId: string, priceGel: number) {
  const settings = await getSettings();
  const existing = await db.proMembership.findUnique({ where: { userId } });
  const now = new Date();
  const base = existing && existing.currentPeriodEnd > now ? existing.currentPeriodEnd : now;
  const periodEnd = new Date(base.getTime() + 30 * 86400000);
  await db.proMembership.upsert({
    where: { userId },
    create: { userId, priceGel, freeModsTotal: settings.pro.freeMods, currentPeriodEnd: periodEnd },
    update: {
      status: "ACTIVE",
      priceGel,
      cancelledAt: null,
      freeModsTotal: settings.pro.freeMods,
      freeModsUsed: 0, // allowance refreshes every paid period
      currentPeriodEnd: periodEnd,
      ...(existing && existing.currentPeriodEnd <= now ? { startedAt: now } : {}),
    },
  });
  await logActivity(userId, "proActivated");
  await notify(userId, "proActivated", {}, { link: "/dashboard/pro", channel: "billing" });
}
