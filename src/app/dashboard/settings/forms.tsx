"use client";

import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, SubmitButton, Switch } from "@/components/ui/form";
import { changePasswordAction, updateNotificationPrefsAction } from "@/app/actions/account";

export function NotificationPrefsForm({ defaults }: { defaults: Record<"emailOnStatus" | "emailOnMessages" | "emailOnBilling" | "emailMarketing", boolean> }) {
  const { d } = useApp();
  const s = d.settings;
  return (
    <ActionForm action={updateNotificationPrefsAction} className="divide-y divide-line">
      <Switch name="emailOnStatus" label={s.emailOnStatus} defaultChecked={defaults.emailOnStatus} />
      <Switch name="emailOnMessages" label={s.emailOnMessages} defaultChecked={defaults.emailOnMessages} />
      <Switch name="emailOnBilling" label={s.emailOnBilling} defaultChecked={defaults.emailOnBilling} />
      <Switch name="emailMarketing" label={s.emailMarketing} defaultChecked={defaults.emailMarketing} />
      <div className="pt-4">
        <SubmitButton size="sm">{d.common.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  const { d } = useApp();
  return (
    <ActionForm action={changePasswordAction} className="space-y-4" reset>
      <Input name="currentPassword" type="password" label={d.settings.currentPassword} autoComplete="current-password" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="password" type="password" label={d.settings.newPassword} autoComplete="new-password" hint={d.auth.passwordHint} />
        <Input name="confirmPassword" type="password" label={d.auth.confirmPassword} autoComplete="new-password" />
      </div>
      <SubmitButton>{d.settings.changePassword}</SubmitButton>
    </ActionForm>
  );
}
