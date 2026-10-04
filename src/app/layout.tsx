import type { Metadata, Viewport } from "next";
import { Inter, Unbounded, Noto_Sans_Georgian } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { getI18n } from "@/lib/i18n/server";
import { getCurrency, THEME_COOKIE } from "@/lib/prefs";
import { getSettings } from "@/lib/settings";
import { appUrl } from "@/lib/utils";
import { CookieConsent } from "@/components/site/cookie-consent";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const display = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-display-face", display: "swap", weight: ["400", "500", "600", "700"] });
const georgian = Noto_Sans_Georgian({ subsets: ["georgian"], variable: "--font-georgian", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { d, locale } = await getI18n();
  return {
    metadataBase: new URL(appUrl()),
    title: { default: d.meta.title, template: `%s · Nexora` },
    description: d.meta.description,
    applicationName: "Nexora Studio",
    openGraph: {
      type: "website",
      siteName: "Nexora Studio",
      title: d.meta.title,
      description: d.meta.description,
      locale: locale === "ka" ? "ka_GE" : locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: { card: "summary_large_image", title: d.meta.title, description: d.meta.description },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applies the stored/system theme before paint to avoid a flash.
const themeScript = `(function(){try{var c=document.cookie.match(/(?:^|; )nx_theme=([^;]+)/);var t=c?c[1]:localStorage.getItem('nx_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ d, locale }, currency, settings, jar] = await Promise.all([getI18n(), getCurrency(), getSettings(), cookies()]);
  const theme = jar.get(THEME_COOKIE)?.value === "light" ? "light" : "dark";

  return (
    <html lang={locale} className={`${inter.variable} ${display.variable} ${georgian.variable} ${theme === "dark" ? "dark" : ""}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
          {d.common.skipToContent}
        </a>
        <AppProviders locale={locale} dict={d} currency={currency} rates={settings.rates} theme={theme}>
          {children}
          <CookieConsent />
        </AppProviders>
      </body>
    </html>
  );
}
