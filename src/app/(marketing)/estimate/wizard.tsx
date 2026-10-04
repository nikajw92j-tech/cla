"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/providers/toast";
import { Button, ButtonLink } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { FEATURES, WEBSITE_TYPES, type Feature, type WebsiteType } from "@/lib/catalog";
import { submitLeadAction } from "@/app/actions/public";
import { cn } from "@/lib/utils";

const TOTAL = 5;

export function EstimateWizard({ packageNames }: { packageNames: Record<string, string> }) {
  const { d, money, t, fmt } = useApp();
  const e = d.estimate;
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [type, setType] = useState<WebsiteType | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pages, setPages] = useState(5);
  const [timeline, setTimeline] = useState<"asap" | "month" | "flexible">("month");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ packageSlug: string; totalGel: number } | null>(null);
  const [pending, start] = useTransition();

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  const canNext = step === 1 ? !!type : true;

  const submit = () =>
    start(async () => {
      const res = await submitLeadAction({ name, email, websiteType: type, features, pages, timeline }).catch(() => null);
      if (!res) return toast("error", t("errors.generic"));
      if (!res.ok) return toast("error", t(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error));
      setResult(res.data!);
      toast("success", e.saved);
    });

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="border-gradient relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />
        <PartyPopper className="relative mx-auto size-10 text-brand" />
        <h2 className="relative mt-4 font-display text-2xl font-semibold text-fg">{e.resultTitle}</h2>
        <p className="relative mt-2 text-muted">{fmt(e.resultText, { pkg: packageNames[result.packageSlug] ?? result.packageSlug })}</p>
        <p className="relative mt-8 text-sm text-muted">{e.range}</p>
        <p className="relative font-display text-5xl font-semibold tracking-tight text-fg">{money(result.totalGel)}</p>
        <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/dashboard/orders/new?package=${result.packageSlug}&features=${features.join(",")}${type ? `&type=${type}` : ""}&pages=${pages}`} size="lg" iconRight={<ArrowRight className="size-4" />}>
            {e.orderNow}
          </ButtonLink>
          <ButtonLink href="/dashboard/messages" variant="secondary" size="lg">
            {e.talk}
          </ButtonLink>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="h-1 bg-fg/[0.06]">
        <motion.div className="h-full bg-gradient-to-r from-brand to-brand-2" animate={{ width: `${(step / TOTAL) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
      <div className="p-6 sm:p-10">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{fmt(e.step, { n: step, total: TOTAL })}</p>
        <div className="relative mt-3 min-h-[300px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && (
                <>
                  <h2 className="mb-6 text-xl font-semibold text-fg sm:text-2xl">{e.q1}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {WEBSITE_TYPES.map((wt) => (
                      <Choice key={wt} active={type === wt} onClick={() => setType(wt)}>
                        {d.labels.websiteType[wt]}
                      </Choice>
                    ))}
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="mb-6 text-xl font-semibold text-fg sm:text-2xl">{e.q2}</h2>
                  <div className="flex flex-wrap gap-2">
                    {FEATURES.map((f) => {
                      const on = features.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setFeatures((c) => (on ? c.filter((x) => x !== f) : [...c, f]))}
                          className={cn("inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm transition-all active:scale-95", on ? "border-brand bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong")}
                        >
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                          {d.labels.feature[f]}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="mb-10 text-xl font-semibold text-fg sm:text-2xl">{e.q3}</h2>
                  <p className="text-center font-display text-6xl font-semibold text-fg">{pages}</p>
                  <input type="range" min={1} max={30} value={pages} onChange={(ev) => setPages(Number(ev.target.value))} className="mt-8 w-full accent-[var(--brand)]" aria-label={e.q3} />
                </>
              )}
              {step === 4 && (
                <>
                  <h2 className="mb-6 text-xl font-semibold text-fg sm:text-2xl">{e.q4}</h2>
                  <div className="grid gap-3">
                    {(["asap", "month", "flexible"] as const).map((tl) => (
                      <Choice key={tl} active={timeline === tl} onClick={() => setTimeline(tl)}>
                        {e.timelines[tl]}
                      </Choice>
                    ))}
                  </div>
                </>
              )}
              {step === 5 && (
                <>
                  <h2 className="mb-6 text-xl font-semibold text-fg sm:text-2xl">{e.contactTitle}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm font-medium text-fg-soft">
                      <span>{e.name}</span>
                      <input className={inputClass} value={name} onChange={(ev) => setName(ev.target.value)} autoComplete="name" />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-fg-soft">
                      <span>{e.email}</span>
                      <input className={inputClass} type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} autoComplete="email" />
                    </label>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 1} icon={<ArrowLeft className="size-4" />}>
            {d.common.back}
          </Button>
          {step < TOTAL ? (
            <Button onClick={() => go(step + 1)} disabled={!canNext}>
              {d.common.next} <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} loading={pending} disabled={!name || !email}>
              {e.getEstimate}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-2xl border px-5 py-4 text-left font-medium transition-all active:scale-[0.98]",
        active ? "border-brand/60 bg-brand/[0.08] text-fg ring-2 ring-brand/30" : "border-line text-fg-soft hover:border-line-strong",
      )}
    >
      {children}
      <span className={cn("grid size-5 place-items-center rounded-full border transition-colors", active ? "border-brand bg-brand text-white" : "border-line-strong")}>
        {active && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
