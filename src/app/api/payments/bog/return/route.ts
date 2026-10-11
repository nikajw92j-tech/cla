import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";
import { paymentReturnPath, syncBogPayment } from "@/lib/payments";

/**
 * Where BOG sends the customer back after the payment page. The redirect itself proves nothing,
 * so the status is re-read from BOG's receipt API (covers a delayed or missed callback).
 */
export async function GET(req: Request) {
  const paymentId = new URL(req.url).searchParams.get("payment") ?? "";
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.redirect(appUrl("/dashboard"));

  const status = await syncBogPayment(payment.id).catch((e) => {
    console.error("BOG sync failed", e);
    return payment.status;
  });
  return NextResponse.redirect(appUrl(paymentReturnPath(payment, status === "SUCCEEDED")));
}
