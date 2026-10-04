import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { fmt, formatDate } from "@/lib/i18n/format";
import { Reveal } from "@/components/site/motion";

const SLUGS = ["privacy", "terms", "refund", "cookies"] as const;
type Slug = (typeof SLUGS)[number];
const UPDATED = "2026-09-01";

// Rendered per request: content follows the visitor's language cookie.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { d } = await getI18n();
  if (!SLUGS.includes(slug as Slug)) return {};
  return { title: d.legal[slug as Slug].title, alternates: { canonical: `/legal/${slug}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUGS.includes(slug as Slug)) notFound();
  const { d, locale } = await getI18n();
  const doc = d.legal[slug as Slug];
  return (
    <section className="pt-32 pb-16 sm:pt-40">
      <div className="container-x max-w-3xl">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{doc.title}</h1>
          <p className="mt-3 text-sm text-muted">{fmt(d.legal.updated, { date: formatDate(UPDATED, locale) })}</p>
          <div className="glass mt-10 space-y-5 rounded-3xl p-8 leading-relaxed text-fg-soft sm:p-10">
            {doc.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
