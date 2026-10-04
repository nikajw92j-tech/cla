"use client";

import type { PortfolioProject } from "@prisma/client";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, SubmitButton, Switch, Textarea } from "@/components/ui/form";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminDeletePortfolioAction, adminSavePortfolioAction } from "@/app/actions/admin";

export function PortfolioForm({ item }: { item?: PortfolioProject }) {
  const { d } = useApp();
  const a = d.admin;
  return (
    <ActionForm action={adminSavePortfolioAction.bind(null, item?.id ?? null)} reset={!item} className="grid gap-3 sm:grid-cols-2">
      <Input name="title" label={a.projectTitle} defaultValue={item?.title} />
      <Input name="category" label={a.category} defaultValue={item?.category} />
      <Textarea name="description" label={a.description} defaultValue={item?.description} rows={2} wrapClass="sm:col-span-2" />
      <Input name="technologies" label={a.technologies} defaultValue={item?.technologies ?? "Next.js, Tailwind CSS"} wrapClass="sm:col-span-2" />
      <Input name="desktopImage" label={a.desktopImage} defaultValue={item?.desktopImage ?? ""} placeholder="https://" optional />
      <Input name="mobileImage" label={a.mobileImage} defaultValue={item?.mobileImage ?? ""} placeholder="https://" optional />
      <Input name="liveUrl" label={a.liveUrl} defaultValue={item?.liveUrl ?? ""} placeholder="https://" optional />
      <div className="grid grid-cols-2 gap-3">
        <Input name="accent" type="color" label={a.accent} defaultValue={item?.accent ?? "#6d5dfc"} className="h-11 p-1" />
        <Input name="sortOrder" type="number" min={0} label={a.order} defaultValue={item?.sortOrder ?? 0} />
      </div>
      <div className="sm:col-span-2">
        <Switch name="published" label={a.published} defaultChecked={item?.published ?? true} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton size="sm">{item ? d.common.save : a.addProject}</SubmitButton>
        {item && (
          <ActionButton action={adminDeletePortfolioAction.bind(null, item.id)} size="sm" variant="danger" confirm={`${d.common.delete}?`}>
            {d.common.delete}
          </ActionButton>
        )}
      </div>
    </ActionForm>
  );
}
