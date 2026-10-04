import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { ResetForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.resetTitle, robots: { index: false } };
}

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const { d } = await getI18n();
  if (!token)
    return (
      <div className="text-center">
        <p className="text-fg-soft">{d.errors.tokenInvalid}</p>
        <Link href="/forgot-password" className="mt-4 inline-block font-medium text-brand hover:underline">
          {d.auth.forgotTitle}
        </Link>
      </div>
    );
  return <ResetForm token={token} />;
}
