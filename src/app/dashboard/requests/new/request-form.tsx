"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Gift, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar, ProBadge } from "@/components/ui/misc";
import { FileDrop } from "@/components/dashboard/widgets";
import { PRIORITIES, REQUEST_CATEGORIES } from "@/lib/catalog";
import type { ModQuote } from "@/lib/pricing";
import { createModRequestAction } from "@/app/actions/requests";
import { cn } from "@/lib/utils";

export function RequestForm({ websites, quote, defaultWebsite, standardCount }: { websites: { id: string; name: string; url: string | null }[]; quote: ModQuote; defaultWebsite?: string; standardCount: number }) {
  const { d, money, fmt } = useApp();
  const f = d.requests.form;
  const p = d.requests.price;
  const [websiteId, setWebsiteId] = useState(defaultWebsite ?? "");
  const [category, setCategory] = useState<string>("TEXT");
  const site = websites.find((w) => w.id === websiteId);

  return (
    <ActionForm action={createModRequestAction} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="glass space-y-5 rounded-3xl p-5 sm:p-8">
        {websites.length > 0 && (
          <Select name="websiteId" label={f.website} value={websiteId} onChange={(e) => setWebsiteId(e.target.value)} hint={f.websitePick}>
            {websites.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
            <option value="">—</option>
          </Select>
        )}
        <Input key={websiteId} name="websiteUrl" label={f.websiteUrl} type="url" placeholder="https://" defaultValue={site?.url ?? ""} inputMode="url" />
        <Input name="title" label={f.requestTitle} placeholder={f.requestTitlePh} maxLength={140} />
        <Textarea name="description" label={f.description} placeholder={f.descriptionPh} rows={5} maxLength={5000} />
        <div>
          <p className="mb-2 text-sm font-medium text-fg-soft">{f.category}</p>
          <input type="hidden" name="category" value={category} />
          <div className="flex flex-wrap gap-1.5">
            {REQUEST_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn("rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95", category === c ? "border-brand bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong")}
              >
                {d.labels.category[c]}
              </button>
            ))}
          </div>
        </div>
        <Select name="priority" label={f.priority} defaultValue="NORMAL">
          {PRIORITIES.map((x) => (
            <option key={x} value={x}>
              {d.labels.priority[x]}
            </option>
          ))}
        </Select>
        <div>
          <p className="mb-2 text-sm font-medium text-fg-soft">{f.files}</p>
          <FileDrop max={6} />
        </div>
        <Textarea name="notes" label={f.notes} optional rows={3} maxLength={2000} />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="border-gradient rounded-3xl p-6">
          <p className="font-semibold text-fg">{p.title}</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{p.estimated}</dt>
              <dd className="text-fg">{money(quote.priceGel)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-1.5 text-muted">
                {p.proDiscount} {quote.isPro && <ProBadge />}
              </dt>
              <dd className={quote.discountGel ? "text-success" : "text-muted"}>{quote.discountGel ? `−${money(quote.discountGel)}` : "—"}</dd>
            </div>
            <div className="flex items-end justify-between border-t border-line pt-3">
              <dt className="font-medium text-fg">{p.final}</dt>
              <dd className="font-display text-3xl font-semibold text-fg">{quote.finalGel === 0 ? <span className="text-gradient">{d.common.free}</span> : money(quote.finalGel)}</dd>
            </div>
          </dl>
          {quote.usesCredit && (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <Gift className="size-4" /> {p.freeCredit}
            </motion.p>
          )}
          {quote.isPro && (
            <div className="mt-4">
              <ProgressBar value={(quote.creditsLeft / quote.creditsTotal) * 100} tone="gold" className="h-2" />
              <p className="mt-2 text-xs text-muted">{fmt(p.creditsLeft, { left: quote.creditsLeft, total: quote.creditsTotal })}</p>
            </div>
          )}
          <SubmitButton size="lg" className="mt-6 w-full" icon={<Sparkles className="size-4" />}>
            {d.requests.submitRequest}
          </SubmitButton>
        </div>

        {!quote.isPro && (
          <div className="rounded-3xl border border-[#f5b544]/30 bg-[linear-gradient(160deg,color-mix(in_oklab,#f5b544_10%,var(--card-solid)),var(--card-solid))] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Crown className="size-4 text-gold" /> {p.upsell}
            </p>
            {standardCount > 0 && <p className="mt-2 text-xs text-muted">{fmt(d.dash.proUpsell.title, { n: standardCount })}</p>}
            <ButtonLink href="/pro" variant="gold" size="sm" className="mt-4 w-full">
              {d.dash.proUpsell.button}
            </ButtonLink>
          </div>
        )}
      </aside>
    </ActionForm>
  );
}
