import "server-only";
import { verify } from "crypto";

/**
 * Bank of Georgia online payments API (https://api.bog.ge/docs/payments/introduction).
 * Configure with BOG_CLIENT_ID / BOG_CLIENT_SECRET; BOG_ENV=sandbox switches to the test environment.
 */

const SANDBOX = process.env.BOG_ENV === "sandbox";

const URLS = SANDBOX
  ? { token: "https://oauth2-sandbox.bog.ge/auth/realms/bog/protocol/openid-connect/token", api: "https://api-sandbox.bog.ge/payments/v1" }
  : { token: "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token", api: "https://api.bog.ge/payments/v1" };

// Keys that sign callbacks (Callback-Signature header, SHA256withRSA over the raw body).
const CALLBACK_PUBLIC_KEY = SANDBOX
  ? `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqczfAuhtxw2iF68kS0Hy
bGSv0ZlDAjsXh6VC8avDl3Vxa9qCn6Pzl37Tl2Z21WodiISLeXdhCtOMTeLNUBeb
CYD31y2/MwnhLYqlCk2bOh29fyPc1iT5Eu/k/1IaNRrK9/UVZaTkhOMeEm+aL4y8
5XsE4UjqftEmwrAdbO2G4cCpuoMC9ZXG9gAdr2BFN6i2Vt9eCen5Poj7E1ik7s8T
GyzploVV0NflhwBGeWnvQANUQGr87gsP5k2JG1z5EwnMybJQ7i3XT726rJMaV6QW
sY5hP72Mtv1I1zL2d9FXm9FWOzbpcXCyxuEBXvqqOHzogri8C7KRRYKyk97Ri7D6
8wIDAQAB
-----END PUBLIC KEY-----`
  : `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

export const bogConfigured = Boolean(process.env.BOG_CLIENT_ID && process.env.BOG_CLIENT_SECRET);

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const basic = Buffer.from(`${process.env.BOG_CLIENT_ID}:${process.env.BOG_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(URLS.token, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BOG auth failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  // The docs show expires_in as either seconds or an epoch-ms timestamp; handle both, refresh a minute early.
  const expiresAt = json.expires_in > 1e9 ? json.expires_in : Date.now() + json.expires_in * 1000;
  cachedToken = { value: json.access_token, expiresAt: Math.min(expiresAt, Date.now() + 3600_000) - 60_000 };
  return cachedToken.value;
}

export type BogOrderStatus =
  | "created"
  | "processing"
  | "completed"
  | "rejected"
  | "refund_requested"
  | "refunded"
  | "refunded_partially"
  | "auth_requested"
  | "blocked"
  | "partial_completed";

export type BogReceipt = {
  order_id: string;
  external_order_id?: string;
  order_status: { key: BogOrderStatus; value?: string };
  purchase_units?: { request_amount?: string; transfer_amount?: string; currency_code?: string };
};

export async function createBogOrder(input: {
  externalOrderId: string;
  amountGel: number;
  description: string;
  callbackUrl: string;
  successUrl: string;
  failUrl: string;
  language: "ka" | "en";
}): Promise<{ id: string; redirectUrl: string }> {
  const res = await fetch(`${URLS.api}/ecommerce/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      "Accept-Language": input.language,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      callback_url: input.callbackUrl,
      external_order_id: input.externalOrderId,
      capture: "automatic",
      purchase_units: {
        currency: "GEL",
        total_amount: input.amountGel,
        basket: [{ product_id: input.externalOrderId, description: input.description, quantity: 1, unit_price: input.amountGel }],
      },
      redirect_urls: { success: input.successUrl, fail: input.failUrl },
      ttl: 60,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BOG create order failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { id: string; _links: { redirect: { href: string } } };
  return { id: json.id, redirectUrl: json._links.redirect.href };
}

export async function getBogReceipt(orderId: string): Promise<BogReceipt> {
  const res = await fetch(`${URLS.api}/receipt/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BOG receipt failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as BogReceipt;
}

/** Verifies the Callback-Signature header against the raw (not re-serialized) request body. */
export function verifyBogCallback(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  try {
    return verify("RSA-SHA256", Buffer.from(rawBody), CALLBACK_PUBLIC_KEY, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}
