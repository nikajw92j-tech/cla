"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, CloudCheck, CreditCard, Crown, Landmark, Loader2, Lock, PartyPopper, Tag, UploadCloud } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/providers/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { FileList, type FileRef } from "@/components/dashboard/widgets";
import { FEATURES, PACKAGE_INCLUDED, STYLES, WEBSITE_TYPES, type Feature, type PackageSlug } from "@/lib/catalog";
import type { PackageView } from "@/lib/content";
import type { OrderQuote } from "@/lib/pricing";
import { quoteOrderAction, removeOrderFileAction, saveOrderDraftAction, submitOrderAction, uploadOrderFilesAction } from "@/app/actions/orders";
import { cn } from "@/lib/utils";

export type WizardDraft = {
  orderId: string | null;
  step: number;
  packageSlug: string | null;
  brandName: string;
  websiteType: string;
  industry: string;
  description: string;
  colors: string;
  style: string;
  pagesCount: number;
  functionality: string;
  examples: string;
  features: string[];
  files: FileRef[];
};

type Brief = Pick<WizardDraft, "brandName" | "websiteType" | "industry" | "description" | "colors" | "style" | "pagesCount" | "functionality" | "examples">;

export function OrderWizard({ packages, featurePrices, initial }: { packages: PackageView[]; featurePrices: Record<Feature, number>; initial: WizardDraft }) {
  const { d, t, money, fmt } = useApp();
  const w = d.wizard;
  const toast = useToast();
  const router = useRouter();

  const [orderId, setOrderId] = useState(initial.orderId);
  const [step, setStep] = useState(Math.min(initial.step, 5));
  const [dir, setDir] = useState(1);
  const [pkg, setPkg] = useState<string | null>(initial.packageSlug);
  const [brief, setBrief] = useState<Brief>({
    brandName: initial.brandName,
    websiteType: initial.websiteType,
    industry: initial.industry,
    description: initial.description,
    colors: initial.colors,
    style: initial.style,
    pagesCount: initial.pagesCount,
    functionality: initial.functionality,
    examples: initial.examples,
  });
  const [features, setFeatures] = useState<string[]>(initial.features);
  const [files, setFiles] = useState<FileRef[]>(initial.files);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSave] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(initial.orderId ? Date.now() : null);
  const [uploading, setUploading] = useState(false);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [quoting, startQuote] = useTransition();
  const [method, setMethod] = useState<"CARD" | "BANK_TRANSFER">("CARD");
  const [agree, setAgree] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [done, setDone] = useState(false);

  const selected = packages.find((p) => p.slug === pkg);
  const included = pkg ? PACKAGE_INCLUDED[pkg as PackageSlug] ?? [] : [];
  const localTotal = useMemo(() => {
    if (!selected) return 0;
    return selected.priceGel + features.filter((f) => !included.includes(f as Feature)).reduce((s, f) => s + (featurePrices[f as Feature] ?? 0), 0);
  }, [selected, features, included, featurePrices]);

  /** Persist the draft; returns the order id. */
  async function persist(nextStep: number) {
    const res = await saveOrderDraftAction(orderId, { packageSlug: (pkg ?? undefined) as PackageSlug | undefined, ...brief, features, step: nextStep }).catch(() => null);
    if (res?.ok && res.data) {
      setOrderId(res.data.orderId);
      setSavedAt(Date.now());
      return res.data.orderId;
    }
    toast("error", t(res && !res.ok ? res.error : "errors.generic"));
    return null;
  }

  function validateBrief() {
    const e: Record<string, string> = {};
    if (!brief.brandName.trim()) e.brandName = "errors.required";
    if (!brief.websiteType) e.websiteType = "errors.required";
    if (!brief.industry.trim()) e.industry = "errors.required";
    if (brief.description.trim().length < 20) e.description = brief.description.trim() ? "errors.tooShort" : "errors.required";
    if (!brief.pagesCount || brief.pagesCount < 1) e.pagesCount = "errors.invalid";
    setErrors(e);
    if (Object.keys(e).length) toast("error", t("errors.checkForm"));
    return !Object.keys(e).length;
  }

  function go(next: number) {
    if (next > step) {
      if (step === 1 && !pkg) return toast("error", t("errors.selectPackage"));
      if (step === 2 && !validateBrief()) return;
    }
    startSave(async () => {
      const id = await persist(next);
      if (!id) return;
      setDir(next > step ? 1 : -1);
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Load the authoritative server quote when reaching review/payment.
  useEffect(() => {
    if (step >= 5 && orderId) {
      startQuote(async () => {
        const res = await quoteOrderAction(orderId, appliedCoupon || undefined);
        if (res.ok && res.data) setQuote(res.data);
      });
    }
  }, [step, orderId, appliedCoupon]);

  function applyCoupon() {
    if (!orderId || !coupon.trim()) return;
    startQuote(async () => {
      const res = await quoteOrderAction(orderId, coupon.trim());
      if (res.ok && res.data) {
        if (res.data.couponError) {
          toast("error", t(res.data.couponError));
        } else {
          setAppliedCoupon(coupon.trim());
          setQuote(res.data);
          toast("success", d.success.couponApplied);
        }
      }
    });
  }

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    const id = orderId ?? (await persist(step));
    if (!id) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(list).forEach((f) => fd.append("files", f));
    const res = await uploadOrderFilesAction(id, fd).catch(() => null);
    setUploading(false);
    if (res?.ok && res.data) setFiles((cur) => [...cur, ...res.data!.files]);
    else toast("error", t(res && !res.ok ? res.error : "errors.generic"));
  }

  function submit() {
    if (!orderId) return;
    if (!agree) {
      setErrors({ agree: "errors.required" });
      return toast("error", t("errors.checkForm"));
    }
    startSubmit(async () => {
      const res = await submitOrderAction(orderId, { method, coupon: appliedCoupon || undefined, agree }).catch(() => null);
      if (!res) return toast("error", t("errors.generic"));
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        if (res.fieldErrors && Object.keys(res.fieldErrors).some((k) => k in brief)) setStep(2);
        return toast("error", t(res.error));
      }
      if (res.data?.checkoutUrl) router.push(res.data.checkoutUrl);
      else setDone(true);
    });
  }

  if (done) return <SuccessScreen orderId={orderId!} method={method} />;

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-danger">{t(errors[k])}</p> : null);
  const finalGel = quote?.totalGel ?? localTotal;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{w.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : savedAt ? <CloudCheck className="size-3.5 text-success" /> : null}
            {savedAt ? w.draftSaved : " "}
          </p>
        </div>
        {orderId && (
          <Button variant="ghost" size="sm" onClick={() => startSave(async () => void ((await persist(step)) && toast("success", d.success.draftSaved)))}>
            {w.saveDraft}
          </Button>
        )}
      </div>

      {/* Stepper */}
      <ol className="mb-8 grid grid-cols-6 gap-1.5 sm:gap-3">
        {w.steps.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "todo";
          return (
            <li key={label} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-fg/[0.07]">
                <motion.div className="h-full bg-gradient-to-r from-brand to-brand-2" initial={false} animate={{ width: state === "todo" ? "0%" : "100%" }} transition={{ duration: 0.5 }} />
              </div>
              <p className={cn("mt-2 hidden truncate text-xs sm:block", state === "todo" ? "text-muted" : "font-medium text-fg")}>
                {n}. {label}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="glass min-h-[420px] overflow-hidden rounded-3xl p-5 sm:p-8">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} initial={{ opacity: 0, x: dir * 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -32 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {step === 1 && (
                <>
                  <StepTitle title={w.s1.title} subtitle={w.s1.subtitle} />
                  <div className="grid gap-3">
                    {packages.map((p) => {
                      const on = pkg === p.slug;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPkg(p.slug)}
                          aria-pressed={on}
                          className={cn(
                            "relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all sm:flex-row sm:items-center",
                            on ? "border-brand/60 bg-brand/[0.06] ring-2 ring-brand/30" : "border-line hover:border-line-strong",
                          )}
                        >
                          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "border-brand bg-brand text-white" : "border-line-strong")}>
                            {on && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          <span className="flex-1">
                            <span className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                              {p.name}
                              {p.isPopular && <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold text-white">{d.pricing.mostPopular}</span>}
                              {p.slug === "ultimate" && <Crown className="size-4 text-gold" />}
                            </span>
                            <span className="mt-0.5 block text-sm text-muted">{p.tagline}</span>
                          </span>
                          <span className="font-display text-2xl font-semibold text-fg">{money(p.priceGel)}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <StepTitle title={w.s2.title} subtitle={w.s2.subtitle} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Labeled label={w.s2.brandName}>
                      <input className={inputClass} aria-invalid={!!errors.brandName} value={brief.brandName} onChange={(e) => setBrief({ ...brief, brandName: e.target.value })} maxLength={120} />
                      {err("brandName")}
                    </Labeled>
                    <Labeled label={w.s2.websiteType}>
                      <select className={inputClass} aria-invalid={!!errors.websiteType} value={brief.websiteType} onChange={(e) => setBrief({ ...brief, websiteType: e.target.value })}>
                        <option value="">—</option>
                        {WEBSITE_TYPES.map((x) => (
                          <option key={x} value={x}>
                            {d.labels.websiteType[x]}
                          </option>
                        ))}
                      </select>
                      {err("websiteType")}
                    </Labeled>
                    <Labeled label={w.s2.industry}>
                      <input className={inputClass} aria-invalid={!!errors.industry} placeholder={w.s2.industryPh} value={brief.industry} onChange={(e) => setBrief({ ...brief, industry: e.target.value })} maxLength={120} />
                      {err("industry")}
                    </Labeled>
                    <Labeled label={w.s2.pages}>
                      <input className={inputClass} type="number" min={1} max={100} aria-invalid={!!errors.pagesCount} value={brief.pagesCount} onChange={(e) => setBrief({ ...brief, pagesCount: Number(e.target.value) })} />
                      {err("pagesCount")}
                    </Labeled>
                    <Labeled label={w.s2.description} className="sm:col-span-2">
                      <textarea className={cn(inputClass, "min-h-32")} aria-invalid={!!errors.description} placeholder={w.s2.descriptionPh} value={brief.description} onChange={(e) => setBrief({ ...brief, description: e.target.value })} maxLength={4000} />
                      {err("description")}
                    </Labeled>
                    <Labeled label={w.s2.colors} optional>
                      <input className={inputClass} placeholder={w.s2.colorsPh} value={brief.colors} onChange={(e) => setBrief({ ...brief, colors: e.target.value })} maxLength={300} />
                    </Labeled>
                    <Labeled label={w.s2.style} optional>
                      <div className="flex flex-wrap gap-1.5">
                        {STYLES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setBrief({ ...brief, style: brief.style === s ? "" : s })}
                            className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", brief.style === s ? "border-brand bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong")}
                          >
                            {d.labels.style[s]}
                          </button>
                        ))}
                      </div>
                    </Labeled>
                    <Labeled label={w.s2.functionality} optional className="sm:col-span-2">
                      <textarea className={inputClass} rows={3} placeholder={w.s2.functionalityPh} value={brief.functionality} onChange={(e) => setBrief({ ...brief, functionality: e.target.value })} maxLength={2000} />
                    </Labeled>
                    <Labeled label={w.s2.examples} optional className="sm:col-span-2">
                      <textarea className={inputClass} rows={3} placeholder={w.s2.examplesPh} value={brief.examples} onChange={(e) => setBrief({ ...brief, examples: e.target.value })} maxLength={2000} />
                    </Labeled>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <StepTitle title={w.s3.title} subtitle={w.s3.subtitle} />
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {FEATURES.map((f) => {
                      const inc = included.includes(f);
                      const on = inc || features.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          disabled={inc}
                          aria-pressed={on}
                          onClick={() => setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                            on ? "border-brand/50 bg-brand/[0.06]" : "border-line hover:border-line-strong",
                            inc && "cursor-default opacity-90",
                          )}
                        >
                          <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border transition-colors", on ? "border-brand bg-brand text-white" : "border-line-strong")}>
                            {on && <Check className="size-3" strokeWidth={3} />}
                          </span>
                          <span className="flex-1 text-sm font-medium text-fg">{d.labels.feature[f]}</span>
                          <span className={cn("text-xs", inc ? "font-semibold text-success" : "text-muted")}>
                            {inc ? w.s3.included : featurePrices[f] > 0 ? `+${money(featurePrices[f])}` : d.common.free}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <StepTitle title={w.s4.title} subtitle={w.s4.subtitle} />
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line px-6 py-10 text-center transition-colors hover:border-brand/50 hover:bg-brand/[0.03]">
                    {uploading ? <Loader2 className="size-8 animate-spin text-brand" /> : <UploadCloud className="size-8 text-brand" />}
                    <span className="mt-3 font-medium text-fg">{uploading ? w.s4.uploading : d.common.dropFiles}</span>
                    <span className="mt-1 text-xs text-muted">{fmt(d.common.filesHint, { max: 20 })}</span>
                    <input type="file" multiple className="sr-only" accept="image/*,.pdf,.doc,.docx,.txt,.zip" disabled={uploading} onChange={(e) => upload(e.target.files).then(() => (e.target.value = ""))} />
                  </label>
                  <div className="mt-6">
                    <p className="mb-3 text-sm font-medium text-fg">{w.s4.uploaded}</p>
                    {files.length ? (
                      <FileList
                        files={files}
                        onRemove={async (id) => {
                          if (!orderId) return;
                          const res = await removeOrderFileAction(orderId, id);
                          if (res.ok) setFiles((cur) => cur.filter((f) => f.id !== id));
                        }}
                      />
                    ) : (
                      <p className="rounded-xl border border-line bg-fg/[0.02] px-4 py-6 text-center text-sm text-muted">{w.s4.none}</p>
                    )}
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <StepTitle title={w.s5.title} subtitle={w.s5.subtitle} />
                  <dl className="divide-y divide-line rounded-2xl border border-line">
                    <Row label={w.s5.package} value={selected?.name} />
                    <Row label={d.wizard.s2.brandName} value={brief.brandName} />
                    <Row label={d.wizard.s2.websiteType} value={brief.websiteType ? d.labels.websiteType[brief.websiteType as keyof typeof d.labels.websiteType] : "—"} />
                    <Row label={d.wizard.s2.industry} value={brief.industry} />
                    <Row label={d.wizard.s2.pages} value={String(brief.pagesCount)} />
                    <Row
                      label={w.s5.features}
                      value={
                        features.length || included.length ? (
                          <span className="flex flex-wrap justify-end gap-1">
                            {[...new Set([...included, ...features])].map((f) => (
                              <span key={f} className="rounded-md bg-fg/[0.06] px-2 py-0.5 text-xs">
                                {d.labels.feature[f as Feature]}
                              </span>
                            ))}
                          </span>
                        ) : (
                          w.s5.noFeatures
                        )
                      }
                    />
                    <div className="px-4 py-3">
                      <dt className="text-sm text-muted">{w.s5.project}</dt>
                      <dd className="mt-1 text-sm whitespace-pre-line text-fg">{brief.description}</dd>
                    </div>
                  </dl>
                  <div className="mt-6">
                    <label className="mb-1.5 block text-sm font-medium text-fg-soft">{w.s5.coupon}</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                        <input className={cn(inputClass, "pl-9 uppercase")} value={coupon} onChange={(e) => setCoupon(e.target.value)} maxLength={40} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
                      </div>
                      <Button variant="secondary" onClick={applyCoupon} loading={quoting && !!coupon} disabled={!coupon.trim()}>
                        {w.s5.apply}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <StepTitle title={w.s6.title} subtitle={w.s6.subtitle} />
                  <div className="grid gap-3">
                    {(
                      [
                        { id: "CARD", icon: CreditCard, title: w.s6.card, desc: w.s6.cardDesc },
                        { id: "BANK_TRANSFER", icon: Landmark, title: w.s6.bank, desc: w.s6.bankDesc },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={method === m.id}
                        onClick={() => setMethod(m.id)}
                        className={cn("flex items-start gap-4 rounded-2xl border p-5 text-left transition-all", method === m.id ? "border-brand/60 bg-brand/[0.06] ring-2 ring-brand/30" : "border-line hover:border-line-strong")}
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                          <m.icon className="size-5" />
                        </span>
                        <span className="flex-1">
                          <span className="block font-semibold text-fg">{m.title}</span>
                          <span className="mt-0.5 block text-sm text-muted">{m.desc}</span>
                        </span>
                        <span className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2", method === m.id ? "border-brand bg-brand text-white" : "border-line-strong")}>
                          {method === m.id && <Check className="size-3" strokeWidth={3} />}
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-fg-soft">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
                    <span>{w.s6.agree}</span>
                  </label>
                  {err("agree")}
                  <p className="mt-6 flex items-center gap-2 text-xs text-muted">
                    <Lock className="size-3.5" /> {w.s6.secure}
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 1 || saving} icon={<ArrowLeft className="size-4" />}>
              {d.common.back}
            </Button>
            {step < 6 ? (
              <Button onClick={() => go(step + 1)} loading={saving}>
                {d.common.next} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={submit} loading={submitting} size="lg">
                {fmt(w.s6.confirm, { amount: money(finalGel) })}
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-gradient rounded-3xl p-6">
            <p className="text-sm font-semibold text-fg">{d.orders.summary}</p>
            {selected ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Building2 className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium text-fg">{selected.name}</p>
                    <p className="text-xs text-muted">{fmt(d.pricing.delivery, { days: selected.deliveryDays })}</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">{w.s5.basePrice}</dt>
                    <dd className="text-fg">{money(quote?.basePriceGel ?? selected.priceGel)}</dd>
                  </div>
                  {(quote?.addons ?? features.filter((f) => !included.includes(f as Feature) && featurePrices[f as Feature] > 0).map((f) => ({ feature: f as Feature, priceGel: featurePrices[f as Feature] }))).map((a) => (
                    <div key={a.feature} className="flex justify-between">
                      <dt className="text-muted">{d.labels.feature[a.feature]}</dt>
                      <dd className="text-fg">+{money(a.priceGel)}</dd>
                    </div>
                  ))}
                  {quote && quote.autoDiscountGel > 0 && (
                    <div className="flex justify-between text-success">
                      <dt>{quote.autoDiscountKind === "pro" ? w.s5.proDiscount : w.s5.discount}</dt>
                      <dd>−{money(quote.autoDiscountGel)}</dd>
                    </div>
                  )}
                  {quote && quote.couponDiscountGel > 0 && (
                    <div className="flex justify-between text-success">
                      <dt>
                        {w.s5.discount} ({appliedCoupon.toUpperCase()})
                      </dt>
                      <dd>−{money(quote.couponDiscountGel)}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                  <span className="text-sm font-medium text-fg">{w.s5.final}</span>
                  <motion.span key={finalGel} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-2xl font-semibold text-fg">
                    {quoting ? <Loader2 className="size-5 animate-spin" /> : money(finalGel)}
                  </motion.span>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted">{d.common.approxNote}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">{d.errors.selectPackage}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-fg">{title}</h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

function Labeled({ label, children, optional, className }: { label: string; children: React.ReactNode; optional?: boolean; className?: string }) {
  const { d } = useApp();
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex justify-between text-sm font-medium text-fg-soft">
        {label}
        {optional && <span className="text-xs font-normal text-muted">{d.common.optional}</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-fg">{value || "—"}</dd>
    </div>
  );
}

function SuccessScreen({ orderId, method }: { orderId: string; method: string }) {
  const { d } = useApp();
  const w = d.wizard.s6;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="mx-auto max-w-xl py-10 text-center">
      <div className="relative mx-auto size-24">
        <motion.div className="absolute inset-0 rounded-full bg-success/20" animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
        <div className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-success to-emerald-600 text-white shadow-[0_20px_60px_-15px_var(--success)]">
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle2 className="size-11" />
          </motion.span>
        </div>
      </div>
      <PartyPopper className="mx-auto mt-6 size-6 text-gold" />
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg">{w.successTitle}</h1>
      <p className="mt-3 text-muted">{w.successText}</p>
      {method === "BANK_TRANSFER" && <p className="mt-2 text-sm text-muted">{w.bankDesc}</p>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={`/dashboard/orders/${orderId}`} size="lg">
          {w.viewOrder}
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary" size="lg">
          {w.goDashboard}
        </ButtonLink>
      </div>
    </motion.div>
  );
}
