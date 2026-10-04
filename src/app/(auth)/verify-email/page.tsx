import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { verifyEmailToken } from "@/app/actions/auth";
import { ButtonLink } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.verifyTitle, robots: { index: false } };
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const { d } = await getI18n();
  const ok = token ? await verifyEmailToken(token) : false;
  return (
    <div className="text-center">
      <div className={`mx-auto grid size-16 place-items-center rounded-2xl ${ok ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
        {ok ? <CheckCircle2 className="size-8" /> : <XCircle className="size-8" />}
      </div>
      <h1 className="mt-6 font-display text-2xl font-semibold text-fg">{d.auth.verifyTitle}</h1>
      <p className="mt-2 text-muted">{ok ? d.auth.verifyOk : d.auth.verifyFail}</p>
      <ButtonLink href="/dashboard" className="mt-8">
        {d.nav.dashboard}
      </ButtonLink>
    </div>
  );
}
