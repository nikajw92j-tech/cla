import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { confirmPayment, failPayment } from "@/lib/payments";

/**
 * Payment-provider webhook. Configure your gateway to POST JSON
 * { paymentId, status: "succeeded" | "failed", reference } with an
 * `x-signature` header = hex(HMAC-SHA256(rawBody, PAYMENT_WEBHOOK_SECRET)).
 */
export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const valid = sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const body = JSON.parse(raw) as { paymentId?: string; status?: string; reference?: string };
  if (!body.paymentId) return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (body.status === "succeeded") await confirmPayment(body.paymentId, body.reference);
  else if (body.status === "failed") await failPayment(body.paymentId);
  return NextResponse.json({ ok: true });
}
