import type { ZodError } from "zod";

/** Uniform server-action result. `error`/`message` are i18n keys (dotted paths). */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T; redirect?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

/** Converts zod issues into { field: i18nKey }. Schemas use i18n keys as messages. */
export function zodFail(err: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path.join(".");
    if (!fieldErrors[k]) fieldErrors[k] = issue.message.startsWith("errors.") ? issue.message : "errors.invalid";
  }
  return { ok: false, error: "errors.checkForm", fieldErrors };
}

export function formObject(fd: FormData) {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}
