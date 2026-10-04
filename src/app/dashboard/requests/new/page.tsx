import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { quoteModification } from "@/lib/pricing";
import { PageHeader } from "@/components/ui/misc";
import { RequestForm } from "./request-form";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.requests.form.title };
}

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ website?: string }> }) {
  const { website } = await searchParams;
  const user = await requireUser("/dashboard/requests/new");
  const { d } = await getI18n();
  const [websites, quote, standardCount] = await Promise.all([
    db.website.findMany({ where: { userId: user.id }, select: { id: true, name: true, url: true }, orderBy: { updatedAt: "desc" } }),
    quoteModification(user),
    db.modificationRequest.count({ where: { userId: user.id, wasPro: false, status: { not: "CANCELLED" } } }),
  ]);
  return (
    <>
      <PageHeader title={d.requests.form.title} subtitle={d.requests.form.subtitle} />
      <RequestForm websites={websites} quote={quote} defaultWebsite={websites.find((w) => w.id === website)?.id ?? websites[0]?.id} standardCount={standardCount} />
    </>
  );
}
