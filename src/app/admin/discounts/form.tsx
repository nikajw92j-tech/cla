"use client";

import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Checkbox, Input, Select, SubmitButton } from "@/components/ui/form";
import { PACKAGE_SLUGS } from "@/lib/catalog";
import { adminCreateDiscountAction } from "@/app/actions/admin";

export function DiscountForm() {
  const { d } = useApp();
  const a = d.admin;
  return (
    <ActionForm action={adminCreateDiscountAction} reset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input name="code" label={a.code} placeholder="LAUNCH20" className="uppercase" maxLength={30} />
      <Select name="type" label={a.type} defaultValue="PERCENT">
        <option value="PERCENT">{a.percent}</option>
        <option value="FIXED">{a.fixed}</option>
      </Select>
      <Input name="value" type="number" min={1} label={a.value} defaultValue={10} />
      <Select name="appliesTo" label={a.appliesTo} defaultValue="ALL">
        <option value="ALL">{d.common.all}</option>
        <option value="ORDER">{d.invoices.purposes.ORDER}</option>
        <option value="MODIFICATION">{d.invoices.purposes.MODIFICATION}</option>
        <option value="PRO">{d.invoices.purposes.PRO}</option>
      </Select>
      <Select name="packageSlug" label={a.package} defaultValue="" optional>
        <option value="">{d.common.all}</option>
        {PACKAGE_SLUGS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>
      <Input name="startsAt" type="date" label={a.startsAt} optional />
      <Input name="endsAt" type="date" label={a.endsAt} optional />
      <Input name="maxUses" type="number" min={1} label={a.maxUses} optional />
      <Input name="description" label={a.description} optional wrapClass="sm:col-span-2" maxLength={200} />
      <div className="flex items-end gap-4 sm:col-span-2">
        <Checkbox name="proOnly" label={a.proOnly} />
        <SubmitButton className="ml-auto">{a.create}</SubmitButton>
      </div>
    </ActionForm>
  );
}
