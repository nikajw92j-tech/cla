"use client";

import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, SubmitButton, Switch, Textarea } from "@/components/ui/form";
import { adminSavePackageAction, adminSaveSettingsAction } from "@/app/actions/admin";
import type { SiteSettings } from "@/lib/settings";

export function PackageForm({ id, defaults }: { id: string; defaults: { priceGel: number; deliveryDays: number; isPopular: boolean; isActive: boolean; content: string } }) {
  const { d } = useApp();
  const a = d.admin;
  return (
    <ActionForm action={adminSavePackageAction.bind(null, id)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input name="priceGel" type="number" min={0} label={a.priceGel} defaultValue={defaults.priceGel} />
        <Input name="deliveryDays" type="number" min={1} label={a.deliveryDays} defaultValue={defaults.deliveryDays} />
      </div>
      <Switch name="isPopular" label={a.popular} defaultChecked={defaults.isPopular} />
      <Switch name="isActive" label={a.activeLabel} defaultChecked={defaults.isActive} />
      <Textarea name="content" label={a.contentJson} defaultValue={defaults.content} rows={12} className="font-mono text-xs" spellCheck={false} />
      <SubmitButton size="sm">{d.common.save}</SubmitButton>
    </ActionForm>
  );
}

type Field = { name: string; label: string; value: number | string; step?: string; type?: string };

export function SettingsForm({ section, fields, toggles = [] }: { section: keyof SiteSettings; fields: Field[]; toggles?: { name: string; label: string; value: boolean }[] }) {
  const { d } = useApp();
  return (
    <ActionForm action={adminSaveSettingsAction.bind(null, section)} className="space-y-4">
      {toggles.map((t) => (
        <Switch key={t.name} name={t.name} label={t.label} defaultChecked={t.value} />
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <Input key={f.name} name={f.name} label={f.label} type={f.type ?? "number"} step={f.step ?? "1"} min={f.type ? undefined : 0} defaultValue={f.value} />
        ))}
      </div>
      <SubmitButton size="sm">{d.common.save}</SubmitButton>
    </ActionForm>
  );
}
