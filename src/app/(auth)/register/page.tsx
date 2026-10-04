import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { RegisterForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.register };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; ref?: string }> }) {
  const { next, ref } = await searchParams;
  return <RegisterForm next={next} referral={ref?.slice(0, 40)} />;
}
