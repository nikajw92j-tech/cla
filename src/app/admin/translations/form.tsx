"use client";

import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import { LOCALES } from "@/lib/catalog";
import { adminSaveTranslationAction } from "@/app/actions/admin";

export function TranslationForm() {
  const { d, locale } = useApp();
  const a = d.admin;
  return (
    <ActionForm action={adminSaveTranslationAction} reset className="grid gap-3 sm:grid-cols-[120px_1fr]">
      <Select name="locale" label="Locale" defaultValue={locale}>
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </Select>
      <Input name="key" label={a.translationKey} placeholder="home.hero.line1" className="font-mono text-sm" />
      <Textarea name="value" label={a.translationValue} rows={2} wrapClass="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton size="sm">{d.common.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}
