import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { ForgotForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.auth.forgotTitle, robots: { index: false } };
}

export default function ForgotPage() {
  return <ForgotForm />;
}
