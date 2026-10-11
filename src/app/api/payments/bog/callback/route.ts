import { NextResponse } from "next/server";
import { verifyBogCallback, type BogReceipt } from "@/lib/bog";
import { applyBogReceipt } from "@/lib/payments";

/**
 * Bank of Georgia payment callback (https://api.bog.ge/docs/payments/standard-process/callback).
 * The signature is checked on the raw body before parsing. Any non-200 makes BOG retry.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyBogCallback(raw, req.headers.get("callback-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(raw) as { event?: string; body?: BogReceipt };
  if (payload.event !== "order_payment" || !payload.body?.order_status) return NextResponse.json({ ok: true });

  await applyBogReceipt(payload.body);
  return NextResponse.json({ ok: true });
}
