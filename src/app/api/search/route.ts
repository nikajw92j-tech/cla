import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await rateLimit("search", 60, 60_000, user.id))) return NextResponse.json({ hits: [] }, { status: 429 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ hits: [] });
  const admin = req.nextUrl.searchParams.get("scope") === "admin" && user.role === "ADMIN";
  const own = admin ? {} : { userId: user.id };
  const base = admin ? "/admin" : "/dashboard";

  const [orders, requests, websites, tickets, customers] = await Promise.all([
    db.order.findMany({ where: { ...own, OR: [{ number: { contains: q, mode: "insensitive" } }, { brandName: { contains: q, mode: "insensitive" } }] }, take: 5 }),
    db.modificationRequest.findMany({ where: { ...own, OR: [{ number: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] }, take: 5 }),
    db.website.findMany({ where: { ...own, OR: [{ name: { contains: q, mode: "insensitive" } }, { url: { contains: q, mode: "insensitive" } }] }, take: 5 }),
    db.supportTicket.findMany({ where: { ...own, OR: [{ number: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] }, take: 5 }),
    admin
      ? db.user.findMany({ where: { OR: [{ email: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] }, take: 5 })
      : Promise.resolve([]),
  ]);

  const hits = [
    ...websites.map((w) => ({ type: "web", title: w.name, subtitle: w.url ?? w.stage, href: `${base}/websites/${w.id}` })),
    ...orders.map((o) => ({ type: "order", title: o.brandName ?? o.number, subtitle: o.number, href: `${base}/orders/${o.id}` })),
    ...requests.map((r) => ({ type: "req", title: r.title, subtitle: r.number, href: `${base}/requests/${r.id}` })),
    ...tickets.map((t) => ({ type: "ticket", title: t.subject, subtitle: t.number, href: `${base}/support/${t.id}` })),
    ...customers.map((c) => ({ type: "user", title: `${c.firstName} ${c.lastName}`, subtitle: c.email, href: `/admin/customers/${c.id}` })),
  ];
  return NextResponse.json({ hits });
}
