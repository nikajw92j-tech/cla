import type { Metadata } from "next";
import { PortfolioGrid } from "@/components/home/portfolio";
import { BeforeAfter } from "@/components/home/before-after";
import { FinalCta } from "@/components/home/sections";
import { Aurora, SectionHeading } from "@/components/site/motion";
import { getI18n } from "@/lib/i18n/server";
import { getPortfolio } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.home.portfolio.title, description: d.home.portfolio.subtitle, alternates: { canonical: "/portfolio" } };
}

export default async function PortfolioPage() {
  const { d } = await getI18n();
  const items = await getPortfolio();
  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
        <Aurora />
        <div className="container-x relative">
          <SectionHeading eyebrow={d.home.portfolio.eyebrow} title={d.home.portfolio.title} subtitle={d.home.portfolio.subtitle} />
          <PortfolioGrid items={items} filterable />
        </div>
      </section>
      <BeforeAfter />
      <FinalCta />
    </>
  );
}
