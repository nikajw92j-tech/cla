"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";

const KEY = "nx_consent";

export function CookieConsent() {
  const { d } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes(`${KEY}=`)) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function choose(value: "all" | "essential") {
    document.cookie = `${KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-live="polite"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="glass fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-xl rounded-2xl p-5 shadow-soft sm:bottom-5"
        >
          <div className="flex gap-4">
            <div className="hidden size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand sm:grid">
              <Cookie className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-fg-soft">
                {d.cookie.text}{" "}
                <Link href="/legal/cookies" className="font-medium text-brand underline-offset-4 hover:underline">
                  {d.cookie.policy}
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => choose("all")}>
                  {d.cookie.accept}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => choose("essential")}>
                  {d.cookie.essential}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
