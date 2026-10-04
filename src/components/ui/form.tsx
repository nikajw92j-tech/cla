"use client";

import { createContext, useContext, useId, useRef, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-providers";
import { useToast } from "@/components/providers/toast";
import type { ActionResult } from "@/lib/action";
import { Button } from "./button";

type FormCtx = { errors: Record<string, string>; pending: boolean };
const Ctx = createContext<FormCtx>({ errors: {}, pending: false });
export const useFormCtx = () => useContext(Ctx);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResult = ActionResult<any>;

/**
 * Wraps a server action: handles pending state, field errors, toasts,
 * redirects and refreshes — so every form has loading/success/error states.
 */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  reset = false,
  toastSuccess = true,
  refresh = true,
  id,
}: {
  action: (fd: FormData) => Promise<AnyResult>;
  children: ReactNode;
  className?: string;
  onSuccess?: (res: Extract<AnyResult, { ok: true }>) => void;
  reset?: boolean;
  toastSuccess?: boolean;
  refresh?: boolean;
  id?: string;
}) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const { t } = useApp();
  const router = useRouter();

  return (
    <Ctx.Provider value={{ errors, pending }}>
      <form
        id={id}
        ref={ref}
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await action(fd).catch(() => null);
            if (!res) {
              toast("error", t("errors.generic"));
              return;
            }
            if (res.ok) {
              setErrors({});
              if (toastSuccess && res.message) toast("success", t(res.message));
              if (reset) ref.current?.reset();
              onSuccess?.(res);
              if (res.redirect) router.push(res.redirect);
              else if (refresh) router.refresh();
            } else {
              setErrors(res.fieldErrors ?? {});
              toast("error", t(res.error));
            }
          });
        }}
      >
        {children}
      </form>
    </Ctx.Provider>
  );
}

export function SubmitButton({ children, pendingText, ...rest }: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormCtx();
  return (
    <Button type="submit" loading={pending} {...rest}>
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-elev/70 px-3.5 py-2.5 text-[0.95rem] text-fg placeholder:text-muted/70 outline-none transition-[border-color,box-shadow] focus:border-brand/60 focus:ring-4 focus:ring-brand/15 disabled:opacity-60 aria-[invalid=true]:border-danger/60";

export function Field({
  name,
  label,
  hint,
  optional,
  children,
  className,
}: {
  name?: string;
  label?: ReactNode;
  hint?: ReactNode;
  optional?: boolean;
  children: (p: { id: string; invalid: boolean; describedBy?: string }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const { errors } = useFormCtx();
  const { t, d } = useApp();
  const err = name ? errors[name] : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg-soft">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-muted">{d.common.optional}</span>}
        </label>
      )}
      {children({ id, invalid: !!err, describedBy: err || hint ? `${id}-d` : undefined })}
      {err ? (
        <p id={`${id}-d`} className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" /> {t(err)}
        </p>
      ) : hint ? (
        <p id={`${id}-d`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Extra = { label?: ReactNode; hint?: ReactNode; optional?: boolean; wrapClass?: string };

export function Input({ label, hint, optional, name, className, wrapClass, ...rest }: ComponentProps<"input"> & Extra) {
  return (
    <Field name={name} label={label} hint={hint} optional={optional} className={wrapClass}>
      {({ id, invalid, describedBy }) => (
        <input id={id} name={name} aria-invalid={invalid} aria-describedby={describedBy} className={cn(inputClass, className)} {...rest} />
      )}
    </Field>
  );
}

export function Textarea({ label, hint, optional, name, className, wrapClass, rows = 4, ...rest }: ComponentProps<"textarea"> & Extra) {
  return (
    <Field name={name} label={label} hint={hint} optional={optional} className={wrapClass}>
      {({ id, invalid, describedBy }) => (
        <textarea
          id={id}
          name={name}
          rows={rows}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(inputClass, "resize-y leading-relaxed", className)}
          {...rest}
        />
      )}
    </Field>
  );
}

const chevron =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238a8ea8' stroke-width='2'><path d='M4 6l4 4 4-4'/></svg>\")";

export function Select({ label, hint, optional, name, className, wrapClass, children, style, ...rest }: ComponentProps<"select"> & Extra) {
  return (
    <Field name={name} label={label} hint={hint} optional={optional} className={wrapClass}>
      {({ id, invalid, describedBy }) => (
        <select
          id={id}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(inputClass, "appearance-none bg-no-repeat pr-9", className)}
          style={{ backgroundImage: chevron, backgroundPosition: "right 0.8rem center", ...style }}
          {...rest}
        >
          {children}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ label, className, ...rest }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-fg-soft", className)}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[var(--brand)]" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/** Toggle switch for boolean settings (submits "on" when checked). */
export function Switch({ label, desc, ...rest }: ComponentProps<"input"> & { label: ReactNode; desc?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        {desc && <span className="block text-xs text-muted">{desc}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" {...rest} />
        <span className="h-6 w-11 rounded-full bg-fg/15 transition-colors peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand/25" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
