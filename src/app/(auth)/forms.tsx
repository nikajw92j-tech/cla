"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Checkbox, Input, SubmitButton, Field, inputClass } from "@/components/ui/form";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-fg">{title}</h1>
      <p className="mt-2 text-muted">{subtitle}</p>
    </motion.div>
  );
}

function PasswordInput({ name, label, autoComplete, hint }: { name: string; label: string; autoComplete: string; hint?: string }) {
  const { d } = useApp();
  const [show, setShow] = useState(false);
  return (
    <Field name={name} label={label} hint={hint}>
      {({ id, invalid, describedBy }) => (
        <div className="relative">
          <input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} aria-invalid={invalid} aria-describedby={describedBy} className={cn(inputClass, "pr-11")} />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-fg"
            aria-label={show ? d.auth.hidePassword : d.auth.showPassword}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
    </Field>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const { d } = useApp();
  const a = d.auth;
  return (
    <>
      <Heading title={a.loginTitle} subtitle={a.loginSubtitle} />
      <ActionForm action={loginAction} className="space-y-5" refresh={false}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Input name="email" type="email" label={a.email} autoComplete="email" autoFocus />
        <PasswordInput name="password" label={a.password} autoComplete="current-password" />
        <div className="flex items-center justify-between">
          <Checkbox name="remember" label={a.remember} defaultChecked />
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
            {a.forgot}
          </Link>
        </div>
        <SubmitButton size="lg" className="w-full">
          {a.login}
        </SubmitButton>
      </ActionForm>
      <p className="mt-8 text-center text-sm text-muted">
        {a.noAccount}{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand hover:underline">
          {a.register}
        </Link>
      </p>
    </>
  );
}

export function RegisterForm({ next, referral }: { next?: string; referral?: string }) {
  const { d } = useApp();
  const a = d.auth;
  return (
    <>
      <Heading title={a.registerTitle} subtitle={a.registerSubtitle} />
      <ActionForm action={registerAction} className="space-y-4" refresh={false}>
        <input type="hidden" name="next" value={next ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="firstName" label={a.firstName} autoComplete="given-name" autoFocus />
          <Input name="lastName" label={a.lastName} autoComplete="family-name" />
        </div>
        <Input name="email" type="email" label={a.email} autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput name="password" label={a.password} autoComplete="new-password" />
          <PasswordInput name="confirmPassword" label={a.confirmPassword} autoComplete="new-password" />
        </div>
        <p className="-mt-1 text-xs text-muted">{a.passwordHint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="phone" type="tel" label={a.phone} optional autoComplete="tel" />
          <Input name="company" label={a.company} optional autoComplete="organization" />
        </div>
        <Input name="referral" label={a.referral} optional defaultValue={referral} />
        <SubmitButton size="lg" className="w-full">
          {a.register}
        </SubmitButton>
        <p className="text-center text-xs text-muted">{a.agree}</p>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-muted">
        {a.haveAccount}{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          {a.login}
        </Link>
      </p>
    </>
  );
}

export function ForgotForm() {
  const { d } = useApp();
  const a = d.auth;
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/15 text-success">
          <MailCheck className="size-7" />
        </div>
        <p className="mt-6 text-fg-soft">{a.forgotSent}</p>
        <Link href="/login" className="mt-6 inline-block font-medium text-brand hover:underline">
          {a.login}
        </Link>
      </motion.div>
    );
  return (
    <>
      <Heading title={a.forgotTitle} subtitle={a.forgotSubtitle} />
      <ActionForm action={forgotPasswordAction} className="space-y-5" onSuccess={() => setSent(true)} toastSuccess={false} refresh={false}>
        <Input name="email" type="email" label={a.email} autoComplete="email" autoFocus />
        <SubmitButton size="lg" className="w-full">
          {a.sendLink}
        </SubmitButton>
      </ActionForm>
      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="font-medium text-brand hover:underline">
          ← {a.login}
        </Link>
      </p>
    </>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { d } = useApp();
  const a = d.auth;
  return (
    <>
      <Heading title={a.resetTitle} subtitle={a.resetSubtitle} />
      <ActionForm action={resetPasswordAction} className="space-y-5" refresh={false}>
        <input type="hidden" name="token" value={token} />
        <PasswordInput name="password" label={a.password} autoComplete="new-password" hint={a.passwordHint} />
        <PasswordInput name="confirmPassword" label={a.confirmPassword} autoComplete="new-password" />
        <SubmitButton size="lg" className="w-full">
          {a.resetButton}
        </SubmitButton>
      </ActionForm>
    </>
  );
}
