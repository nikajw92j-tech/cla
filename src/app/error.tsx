"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button, ButtonLink } from "@/components/ui/button";

/** Friendly error boundary — never shows stack traces or technical messages to users. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { d } = useApp();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="grid min-h-[70dvh] place-items-center px-4 text-center">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-fg">{d.common.somethingWrong}</h1>
        <p className="mt-2 text-muted">{d.errors.generic}</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted">ref: {error.digest}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset} icon={<RotateCcw className="size-4" />}>
            {d.common.tryAgain}
          </Button>
          <ButtonLink href="/" variant="secondary">
            {d.common.goHome}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
