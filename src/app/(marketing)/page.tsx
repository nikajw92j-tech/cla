import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { StatsBand, PromoVideo, Services, HowItWorks, PricingSection, ProTeaser, EstimateCta, FinalCta } from "@/components/home/sections";
import { Reviews, Faq } from "@/components/home/faq-reviews";
import { SectionHeading } from "@/components/site/motion";
import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { getPackages, getPortfolio, getPublicReviews } from "@/lib/content";
import { appUrl } from "@/lib/utils";

// Heavier interactive sections are split into their own chunks.
const Calculator = dynamic(() => import("@/components/home/calculator").then((m) => m.Calculator));
const BeforeAfter = dynamic(() => import("@/components/home/before-after").then((m) => m.BeforeAfter));
const PortfolioGrid = dynamic(() => import("@/components/home/portfolio").then((m) => m.PortfolioGrid));

export default async function HomePage() {
  const { d, locale } = await getI18n();
  const [settings, packages, portfolio, reviews] = await Promise.all([getSettings(), getPackages(locale), getPortfolio(3), getPublicReviews()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Nexora Studio",
    url: appUrl(),
    description: d.meta.description,
    areaServed: "GE",
    address: { "@type": "PostalAddress", addressLocality: "Tbilisi", addressCountry: "GE" },
    makesOffer: packages.map((p) => ({ "@type": "Offer", name: p.name, price: p.priceGel, priceCurrency: "GEL" })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <StatsBand stats={settings.stats} />
      <PromoVideo />
      <Services />
      <HowItWorks />
      <PricingSection packages={packages} />
      <Calculator
        packagePrices={Object.fromEntries(packages.map((p) => [p.slug, p.priceGel]))}
        packageNames={Object.fromEntries(packages.map((p) => [p.slug, p.name]))}
        featurePrices={settings.featurePrices}
      />
      <section id="portfolio" className="scroll-mt-24 py-24 sm:py-32">
        <div className="container-x">
          <SectionHeading eyebrow={d.home.portfolio.eyebrow} title={d.home.portfolio.title} subtitle={d.home.portfolio.subtitle} />
          <PortfolioGrid items={portfolio} />
          <div className="mt-12 flex justify-center">
            <ButtonLink href="/portfolio" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
              {d.home.portfolio.viewAll}
            </ButtonLink>
          </div>
        </div>
      </section>
      <BeforeAfter />
      <ProTeaser priceGel={settings.pro.priceGel} />
      <Reviews reviews={reviews} />
      <EstimateCta />
      <Faq />
      <FinalCta />
    </>
  );
}
