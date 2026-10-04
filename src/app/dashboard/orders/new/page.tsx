import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getPackages } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { FEATURES, PACKAGE_SLUGS, WEBSITE_TYPES, isOneOf } from "@/lib/catalog";
import { safeJson } from "@/lib/utils";
import { OrderWizard, type WizardDraft } from "./wizard";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.wizard.title };
}

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard/orders/new");
  const { locale } = await getI18n();
  const [packages, settings] = await Promise.all([getPackages(locale), getSettings()]);

  let draft: WizardDraft | null = null;
  if (sp.draft) {
    const o = await db.order.findFirst({ where: { id: sp.draft, userId: user.id, status: "DRAFT" }, include: { package: true, files: true } });
    if (o)
      draft = {
        orderId: o.id,
        step: o.draftStep,
        packageSlug: o.package?.slug ?? null,
        brandName: o.brandName ?? "",
        websiteType: o.websiteType ?? "",
        industry: o.industry ?? "",
        description: o.description ?? "",
        colors: o.colors ?? "",
        style: o.style ?? "",
        pagesCount: o.pagesCount ?? 5,
        functionality: o.functionality ?? "",
        examples: o.examples ?? "",
        features: safeJson<string[]>(o.features, []),
        files: o.files.map(({ id, originalName, mimeType, size }) => ({ id, originalName, mimeType, size })),
      };
  }
  if (!draft) {
    // Prefill from the calculator / estimate funnel.
    const features = (sp.features ?? "").split(",").filter((f) => isOneOf(FEATURES, f));
    draft = {
      orderId: null,
      step: isOneOf(PACKAGE_SLUGS, sp.package) ? 2 : 1,
      packageSlug: isOneOf(PACKAGE_SLUGS, sp.package) ? sp.package : null,
      brandName: user.profile?.company ?? "",
      websiteType: isOneOf(WEBSITE_TYPES, sp.type) ? sp.type : "",
      industry: "",
      description: "",
      colors: "",
      style: "",
      pagesCount: Math.min(100, Math.max(1, Number(sp.pages) || 5)),
      functionality: "",
      examples: "",
      features,
      files: [],
    };
  }

  return <OrderWizard packages={packages} featurePrices={settings.featurePrices} initial={draft} />;
}
