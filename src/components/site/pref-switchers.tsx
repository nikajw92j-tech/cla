"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Globe, Moon, Sun } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { CURRENCIES, CURRENCY_SYMBOL, LOCALES, type Currency, type Locale } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const LANGS: Record<Locale, { flag: string; label: string; short: string }> = {
  ka: { flag: "🇬🇪", label: "ქართული", short: "KA" },
  en: { flag: "🇬🇧", label: "English", short: "EN" },
  ru: { flag: "🇷🇺", label: "Русский", short: "RU" },
};

function Dropdown<T extends string>({
  label,
  value,
  options,
  render,
  trigger,
  onSelect,
  align = "right",
  up,
}: {
  label: string;
  value: T;
  options: readonly T[];
  render: (v: T) => React.ReactNode;
  trigger: React.ReactNode;
  onSelect: (v: T) => void;
  align?: "left" | "right";
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-fg-soft transition-colors hover:bg-fg/[0.06] hover:text-fg"
      >
        {trigger}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: up ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: up ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 min-w-44 overflow-hidden rounded-xl border border-line bg-card-solid p-1 shadow-soft",
              align === "right" ? "right-0" : "left-0",
              up ? "bottom-full mb-2" : "top-full mt-2",
            )}
          >
            {options.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o === value}
                  onClick={() => {
                    setOpen(false);
                    if (o !== value) onSelect(o);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-fg/[0.06]",
                    o === value ? "text-fg" : "text-fg-soft",
                  )}
                >
                  <span className="flex items-center gap-2.5">{render(o)}</span>
                  {o === value && <Check className="size-4 text-brand" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LanguageSelect({ align, up }: { align?: "left" | "right"; up?: boolean }) {
  const { locale, setLocale, d } = useApp();
  return (
    <Dropdown
      label={d.nav.language}
      value={locale}
      options={LOCALES}
      align={align}
      up={up}
      onSelect={setLocale}
      trigger={
        <>
          <Globe className="size-4" />
          <span>{LANGS[locale].short}</span>
        </>
      }
      render={(l) => (
        <>
          <span className="text-base leading-none">{LANGS[l].flag}</span>
          {LANGS[l].label}
        </>
      )}
    />
  );
}

export function CurrencySelect({ align, up }: { align?: "left" | "right"; up?: boolean }) {
  const { currency, setCurrency, d } = useApp();
  return (
    <Dropdown<Currency>
      label={d.nav.currency}
      value={currency}
      options={CURRENCIES}
      align={align}
      up={up}
      onSelect={setCurrency}
      trigger={
        <>
          <span className="grid size-5 place-items-center rounded-md bg-fg/[0.07] text-xs">{CURRENCY_SYMBOL[currency]}</span>
          <span>{currency}</span>
        </>
      }
      render={(c) => (
        <>
          <span className="grid size-6 place-items-center rounded-md bg-fg/[0.07] text-xs">{CURRENCY_SYMBOL[c]}</span>
          {c}
        </>
      )}
    />
  );
}

export function ThemeToggle() {
  const { theme, setTheme, d } = useApp();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={`${d.nav.theme}: ${dark ? d.nav.light : d.nav.dark}`}
      className="relative grid size-9 place-items-center overflow-hidden rounded-lg text-fg-soft transition-colors hover:bg-fg/[0.06] hover:text-fg"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
