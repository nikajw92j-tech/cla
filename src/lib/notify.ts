import "server-only";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/server";
import { tk } from "@/lib/i18n/format";
import { sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/utils";
import { isOneOf, LOCALES } from "@/lib/catalog";

type Channel = "status" | "messages" | "billing" | "none";

/**
 * Creates an in-app notification (rendered client-side in the viewer's language)
 * and emails the user in their saved language if their preferences allow it.
 * String params starting with "@" are i18n references, e.g. "@status.request.IN_PROGRESS".
 */
export async function notify(
  userId: string,
  kind: string,
  params: Record<string, string | number> = {},
  opts: { link?: string; channel?: Channel } = {},
) {
  await db.notification.create({ data: { userId, kind, params: JSON.stringify(params), link: opts.link } });
  const channel = opts.channel ?? "status";
  if (channel === "none") return;
  const user = await db.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) return;
  const p = user.profile;
  const allowed =
    channel === "status"
      ? p?.emailOnStatus !== false
      : channel === "messages"
        ? p?.emailOnMessages !== false
        : p?.emailOnBilling !== false;
  if (!allowed) return;
  const d = await getDictionary(isOneOf(LOCALES, user.locale) ? user.locale : "en");
  const text = tk(d, `notif.${kind}`, resolveParams(params, (k) => tk(d, k)));
  await sendMail(user.email, text, text, opts.link ? { label: d.nav.dashboard, url: appUrl(opts.link) } : undefined);
}

export function resolveParams(params: Record<string, string | number>, resolve: (key: string) => string) {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) out[k] = typeof v === "string" && v.startsWith("@") ? resolve(v.slice(1)) : v;
  return out;
}

export async function logActivity(userId: string, kind: string, params: Record<string, string | number> = {}, websiteId?: string) {
  await db.activity.create({ data: { userId, kind, params: JSON.stringify(params), websiteId } });
}
