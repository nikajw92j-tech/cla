import Link from "next/link";
import { Facebook, Github, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { Logo } from "./logo";
import { CurrencySelect, LanguageSelect } from "./pref-switchers";

export async function Footer() {
  const [{ d }, settings] = await Promise.all([getI18n(), getSettings()]);
  const c = settings.contact;
  const cols = [
    {
      title: d.footer.company,
      links: [
        { href: "/#services", label: d.footer.services },
        { href: "/pricing", label: d.footer.pricing },
        { href: "/portfolio", label: d.footer.portfolio },
        { href: "/pro", label: d.footer.pro },
        { href: "/#faq", label: d.footer.faq },
        { href: "/dashboard/support", label: d.footer.support },
      ],
    },
    {
      title: d.footer.legal,
      links: [
        { href: "/legal/privacy", label: d.footer.privacy },
        { href: "/legal/terms", label: d.footer.terms },
        { href: "/legal/refund", label: d.footer.refund },
        { href: "/legal/cookies", label: d.footer.cookies },
      ],
    },
  ];
  const socials = [
    { href: c.instagram, icon: Instagram, label: "Instagram" },
    { href: c.facebook, icon: Facebook, label: "Facebook" },
    { href: c.linkedin, icon: Linkedin, label: "LinkedIn" },
    { href: c.github, icon: Github, label: "GitHub" },
  ].filter((s) => s.href);

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(60%_100%_at_50%_100%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent)]" />
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{d.footer.description}</p>
          <div className="mt-6 flex gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="grid size-10 place-items-center rounded-xl border border-line text-fg-soft transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand"
              >
                <s.icon className="size-[18px]" />
              </a>
            ))}
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-fg">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-semibold text-fg">{d.footer.preferences}</h3>
          <div className="mt-3 flex flex-wrap gap-1 rounded-xl border border-line bg-card p-1">
            <LanguageSelect align="left" up />
            <CurrencySelect align="left" up />
          </div>
          <ul className="mt-6 space-y-2.5 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> <a href={`mailto:${c.email}`} className="hover:text-fg">{c.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-fg">{c.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" /> {c.address}
            </li>
          </ul>
        </div>
      </div>
      <div className="container-x relative flex flex-col items-center justify-between gap-2 border-t border-line py-6 text-xs text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} Nexora Studio. {d.footer.rights}</p>
        <p className="font-display tracking-tight">nexora<span className="text-brand">.</span>ge</p>
      </div>
    </footer>
  );
}
