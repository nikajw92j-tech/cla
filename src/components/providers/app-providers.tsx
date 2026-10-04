"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";
import type { Dict } from "@/lib/i18n/dictionaries/en";
import { fmt, tk, formatDate, formatRelative } from "@/lib/i18n/format";
import { formatMoney, convert, type Rates } from "@/lib/currency";
import type { Currency, Locale } from "@/lib/catalog";
import { setCurrencyAction, setLocaleAction, setThemeAction } from "@/app/actions/prefs";
import { ToastProvider } from "./toast";

type Ctx = {
  locale: Locale;
  d: Dict;
  t: (key: string | undefined, params?: Record<string, string | number>) => string;
  fmt: typeof fmt;
  date: (d: Date | string, o?: Intl.DateTimeFormatOptions) => string;
  rel: (d: Date | string) => string;
  currency: Currency;
  rates: Rates;
  money: (gel: number, opts?: { approx?: boolean }) => string;
  convert: (gel: number) => number;
  theme: "light" | "dark";
  setLocale: (l: Locale) => void;
  setCurrency: (c: Currency) => void;
  setTheme: (t: "light" | "dark") => void;
  switching: boolean;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProviders(props: {
  children: ReactNode;
  locale: Locale;
  dict: Dict;
  currency: Currency;
  rates: Rates;
  theme: "light" | "dark";
}) {
  const router = useRouter();
  const [switching, start] = useTransition();
  const [currency, setCur] = useState(props.currency);
  const [theme, setThemeState] = useState(props.theme);

  const setLocale = useCallback(
    (l: Locale) =>
      start(async () => {
        await setLocaleAction(l);
        router.refresh();
      }),
    [router],
  );
  const setCurrency = useCallback((c: Currency) => {
    setCur(c); // optimistic: prices update instantly
    start(async () => {
      await setCurrencyAction(c);
      router.refresh();
    });
  }, [router]);
  const setTheme = useCallback((t: "light" | "dark") => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try { localStorage.setItem("nx_theme", t); } catch {}
    void setThemeAction(t);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale: props.locale,
      d: props.dict,
      t: (key, params) => tk(props.dict, key, params),
      fmt,
      date: (x, o) => formatDate(x, props.locale, o),
      rel: (x) => formatRelative(x, props.locale),
      currency,
      rates: props.rates,
      money: (gel, o) => formatMoney(gel, currency, props.rates, o),
      convert: (gel) => convert(gel, currency, props.rates),
      theme,
      setLocale,
      setCurrency,
      setTheme,
      switching,
    }),
    [props.locale, props.dict, props.rates, currency, theme, setLocale, setCurrency, setTheme, switching],
  );

  return (
    <AppCtx.Provider value={value}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{props.children}</ToastProvider>
      </MotionConfig>
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside <AppProviders>");
  return ctx;
}
