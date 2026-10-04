import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { LoginForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.login, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
