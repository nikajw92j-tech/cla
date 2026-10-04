import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return NextResponse.json({
    unread,
    items: items.map((n) => ({ id: n.id, kind: n.kind, params: safeJson(n.params, {}), link: n.link, readAt: n.readAt, createdAt: n.createdAt })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { all?: boolean; id?: string };
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(body.all ? {} : { id: String(body.id ?? "") }) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
