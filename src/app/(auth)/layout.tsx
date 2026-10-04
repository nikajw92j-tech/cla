import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { CurrencySelect, LanguageSelect, ThemeToggle } from "@/components/site/pref-switchers";
import { Aurora } from "@/components/site/motion";
import { getI18n } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { d } = await getI18n();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <LanguageSelect />
            <CurrencySelect />
            <ThemeToggle />
          </div>
        </div>
        <main id="main" className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
      <aside className="noise relative hidden overflow-hidden bg-[#07080d] p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <Aurora />
        <div className="bg-grid absolute inset-0 opacity-40 [--grid:rgba(255,255,255,0.05)]" />
        {/* Mini dashboard illustration */}
        <div className="absolute top-[12%] right-12 left-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">kafe.ge</span>
              <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs text-amber-300">● {d.status.stage.DEVELOPMENT}</span>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-[#8b7bff] to-[#22d3ee]" />
            </div>
            <div className="mt-6 space-y-3">
              {[d.status.stage.STARTED, d.status.stage.DESIGN, d.status.stage.DEVELOPMENT].map((s) => (
                <div key={s} className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="size-4 text-emerald-400" /> {s}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 ml-auto w-3/4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <p className="text-xs text-white/50">{d.common.team}</p>
            <p className="mt-1 text-sm text-white/85">{d.notif.designReady}</p>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl leading-tight font-semibold tracking-tight">{d.auth.sideTitle}</h2>
          <p className="mt-4 max-w-md text-white/65">{d.auth.sideText}</p>
        </div>
      </aside>
    </div>
  );
}
