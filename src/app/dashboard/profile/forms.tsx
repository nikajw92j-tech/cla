"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, SubmitButton, Textarea, useFormCtx } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { updateProfileAction, uploadAvatarAction } from "@/app/actions/account";
import { Loader2 } from "lucide-react";

export function ProfileForm({ defaults }: { defaults: Record<string, string> }) {
  const { d } = useApp();
  const a = d.auth;
  return (
    <ActionForm action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
      <Input name="firstName" label={a.firstName} defaultValue={defaults.firstName} autoComplete="given-name" />
      <Input name="lastName" label={a.lastName} defaultValue={defaults.lastName} autoComplete="family-name" />
      <Input name="phone" type="tel" label={a.phone} defaultValue={defaults.phone} optional autoComplete="tel" />
      <Input name="company" label={a.company} defaultValue={defaults.company} optional autoComplete="organization" />
      <Input name="country" label={d.profile.country} defaultValue={defaults.country} optional autoComplete="country-name" />
      <Textarea name="bio" label={d.profile.bio} defaultValue={defaults.bio} optional rows={4} wrapClass="sm:col-span-2" maxLength={500} />
      <div className="sm:col-span-2">
        <SubmitButton>{d.common.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function AvatarPicker() {
  const { d } = useApp();
  const { pending } = useFormCtx();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className={buttonClass("secondary", "sm", "mt-5 cursor-pointer")}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
      <span>{d.profile.changeAvatar}</span>
      <input ref={ref} type="file" name="avatar" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
    </label>
  );
}

export function AvatarForm() {
  return (
    <ActionForm action={uploadAvatarAction}>
      <AvatarPicker />
    </ActionForm>
  );
}
