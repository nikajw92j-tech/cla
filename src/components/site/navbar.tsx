"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Menu, X } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";
import { CurrencySelect, LanguageSelect, ThemeToggle } from "./pref-switchers";

export type NavUser = { name: string; role: string; isPro: boolean } | null;

export function Navbar({ user }: { user: NavUser }) {
  const { d } = useApp();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: d.nav.home },
    { href: "/#services", label: d.nav.services },
    { href: "/pricing", label: d.nav.pricing },
    { href: "/portfolio", label: d.nav.portfolio },
    { href: "/#how", label: d.nav.how },
    { href: "/pro", label: d.nav.pro },
    { href: "/#faq", label: d.nav.faq },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dashHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled ? "border-b border-line bg-bg/70 backdrop-blur-xl backdrop-saturate-150" : "border-b border-transparent",
        )}
      >
        <nav className="container-x flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          <Logo />
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = l.href === pathname;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn("relative rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "text-fg" : "text-fg-soft hover:text-fg")}
                  >
                    {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-fg/[0.06]" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden items-center gap-1 lg:flex">
            <LanguageSelect />
            <CurrencySelect />
            <ThemeToggle />
            <span className="mx-2 h-5 w-px bg-line" />
            {user ? (
              <ButtonLink href={dashHref} size="sm" icon={<LayoutDashboard className="size-4" />}>
                {user.role === "ADMIN" ? d.nav.admin : d.nav.dashboard}
              </ButtonLink>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-fg-soft transition-colors hover:text-fg">
                  {d.nav.login}
                </Link>
                <ButtonLink href="/register" size="sm" iconRight={<ArrowRight className="size-4" />}>
                  {d.nav.getStarted}
                </ButtonLink>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-lg text-fg hover:bg-fg/[0.06]"
              aria-label={d.nav.openMenu}
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-2xl" onClick={() => setOpen(false)} />
            <motion.div
              className="relative flex h-full flex-col px-5 pt-4 pb-8"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex h-12 items-center justify-between">
                <Logo />
                <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-lg hover:bg-fg/[0.06]" aria-label={d.nav.closeMenu}>
                  <X className="size-5" />
                </button>
              </div>
              <motion.ul
                className="mt-8 flex-1 space-y-1"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              >
                {links.map((l) => (
                  <motion.li key={l.href} variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-3.5 font-display text-2xl font-medium tracking-tight text-fg transition-colors hover:bg-fg/[0.05]"
                    >
                      {l.label}
                      <ArrowRight className="size-5 text-muted" />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-2xl border border-line bg-card p-2">
                  <LanguageSelect align="left" up />
                  <CurrencySelect align="left" up />
                </div>
                {user ? (
                  <ButtonLink href={dashHref} size="lg" className="w-full">
                    {user.role === "ADMIN" ? d.nav.admin : d.nav.dashboard}
                  </ButtonLink>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <ButtonLink href="/login" variant="secondary" size="lg">
                      {d.nav.login}
                    </ButtonLink>
                    <ButtonLink href="/register" size="lg">
                      {d.nav.getStarted}
                    </ButtonLink>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
