import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { getPackages } from "@/lib/content";
import { Aurora } from "@/components/site/motion";
import { EstimateWizard } from "./wizard";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.estimate.title, description: d.estimate.subtitle, alternates: { canonical: "/estimate" } };
}

export default async function EstimatePage() {
  const { d, locale } = await getI18n();
  const packages = await getPackages(locale);
  return (
    <section className="relative min-h-[80dvh] overflow-hidden pt-32 pb-16 sm:pt-40">
      <Aurora />
      <div className="container-x relative max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl">{d.estimate.title}</h1>
          <p className="mt-3 text-muted">{d.estimate.subtitle}</p>
        </div>
        <EstimateWizard packageNames={Object.fromEntries(packages.map((p) => [p.slug, p.name]))} />
      </div>
    </section>
  );
}
