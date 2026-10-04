"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CreditCard,
  Crown,
  FileText,
  Gift,
  Globe2,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  User,
  Wand2,
  X,
  ArrowLeft,
  BarChart3,
  Users,
  Receipt,
  Tag,
  Languages,
  Image as ImageIcon,
  Star,
  Inbox,
  FileSearch,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { Logo } from "@/components/site/logo";
import { CurrencySelect, LanguageSelect, ThemeToggle } from "@/components/site/pref-switchers";
import { Avatar, ProBadge } from "@/components/ui/misc";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { DashboardSearch } from "./search";

export type ShellUser = { name: string; email: string; avatar: string | null; isPro: boolean; role: string };
type Item = { href: string; label: string; icon: LucideIcon; badge?: number };

export function DashboardShell({ user, children, counts, mode = "customer" }: { user: ShellUser; children: ReactNode; counts: { messages: number; notifications: number }; mode?: "customer" | "admin" }) {
  const { d } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const n = d.dash.nav;
  const a = d.admin.nav;
  const groups: { items: Item[] }[] =
    mode === "customer"
      ? [
          {
            items: [
              { href: "/dashboard", label: n.overview, icon: LayoutGrid },
              { href: "/dashboard/websites", label: n.websites, icon: Globe2 },
              { href: "/dashboard/orders", label: n.orders, icon: Package },
              { href: "/dashboard/requests", label: n.requests, icon: Wand2 },
              { href: "/dashboard/messages", label: n.messages, icon: MessageSquare, badge: counts.messages },
            ],
          },
          {
            items: [
              { href: "/dashboard/pro", label: n.pro, icon: Crown },
              { href: "/dashboard/invoices", label: n.invoices, icon: FileText },
              { href: "/dashboard/notifications", label: n.notifications, icon: Bell, badge: counts.notifications },
              { href: "/dashboard/referrals", label: n.referrals, icon: Gift },
            ],
          },
          {
            items: [
              { href: "/dashboard/profile", label: n.profile, icon: User },
              { href: "/dashboard/settings", label: n.settings, icon: Settings },
              { href: "/dashboard/support", label: n.support, icon: LifeBuoy },
            ],
          },
        ]
      : [
          {
            items: [
              { href: "/admin", label: a.analytics, icon: BarChart3 },
              { href: "/admin/customers", label: a.customers, icon: Users },
              { href: "/admin/orders", label: a.orders, icon: Package },
              { href: "/admin/websites", label: a.websites, icon: Globe2 },
              { href: "/admin/requests", label: a.requests, icon: Wand2 },
              { href: "/admin/messages", label: a.messages, icon: MessageSquare, badge: counts.messages },
              { href: "/admin/support", label: a.support, icon: LifeBuoy },
            ],
          },
          {
            items: [
              { href: "/admin/memberships", label: a.memberships, icon: Crown },
              { href: "/admin/payments", label: a.payments, icon: Receipt },
              { href: "/admin/packages", label: a.packages, icon: CreditCard },
              { href: "/admin/discounts", label: a.discounts, icon: Tag },
            ],
          },
          {
            items: [
              { href: "/admin/content", label: a.content, icon: Settings },
              { href: "/admin/portfolio", label: a.portfolio, icon: ImageIcon },
              { href: "/admin/reviews", label: a.reviews, icon: Star },
              { href: "/admin/translations", label: a.translations, icon: Languages },
              { href: "/admin/leads", label: a.leads, icon: Inbox },
            ],
          },
        ];

  const root = mode === "customer" ? "/dashboard" : "/admin";
  const isActive = (href: string) => (href === root ? pathname === root : pathname.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo href={root} />
        {mode === "admin" && <span className="rounded-md bg-danger/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-danger">ADMIN</span>}
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((g, gi) => (
          <ul key={gi} className="space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "text-fg" : "text-muted hover:bg-fg/[0.04] hover:text-fg",
                    )}
                  >
                    {active && (
                      <motion.span layoutId={`side-${mode}`} className="absolute inset-0 rounded-xl border border-line bg-fg/[0.06]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                    )}
                    <it.icon className={cn("relative size-[18px] transition-colors", active ? "text-brand" : "group-hover:text-fg")} />
                    <span className="relative flex-1 truncate">{it.label}</span>
                    {!!it.badge && <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">{it.badge > 99 ? "99+" : it.badge}</span>}
                    {it.href === "/dashboard/pro" && !user.isPro && <span className="relative size-1.5 rounded-full bg-gold" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
      <div className="border-t border-line p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-fg/[0.04] hover:text-fg">
          <ArrowLeft className="size-[18px]" /> {n.backToSite}
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_40%_at_70%_0%,color-mix(in_oklab,var(--brand)_8%,transparent),transparent)]" />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-bg/80 backdrop-blur-xl lg:block">{nav}</aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-card-solid lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-3 grid size-9 place-items-center rounded-lg hover:bg-fg/[0.06]" aria-label={d.nav.closeMenu}>
                <X className="size-5" />
              </button>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/75 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg hover:bg-fg/[0.06] lg:hidden" aria-label={d.nav.openMenu}>
            <Menu className="size-5" />
          </button>
          <DashboardSearch mode={mode} />
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              <LanguageSelect />
              <CurrencySelect />
            </div>
            <ThemeToggle />
            <NotificationBell initialUnread={counts.notifications} />
            <UserMenu user={user} mode={mode} />
          </div>
        </header>
        <main id="main" className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function UserMenu({ user, mode }: { user: ShellUser; mode: string }) {
  const { d } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-fg/[0.06]" aria-expanded={open} aria-haspopup="menu">
        <Avatar src={user.avatar} name={user.name} size={32} />
        {user.isPro && <ProBadge className="hidden sm:inline-flex" />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-card-solid p-1.5 shadow-soft"
            >
              <div className="px-3 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                  {user.name} {user.isPro && <ProBadge />}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <div className="h-px bg-line" />
              {mode === "customer" ? (
                <>
                  <MenuLink href="/dashboard/profile" icon={User} label={d.dash.nav.profile} onClick={() => setOpen(false)} />
                  <MenuLink href="/dashboard/settings" icon={Settings} label={d.dash.nav.settings} onClick={() => setOpen(false)} />
                  {user.role === "ADMIN" && <MenuLink href="/admin" icon={FileSearch} label={d.nav.admin} onClick={() => setOpen(false)} />}
                </>
              ) : (
                <MenuLink href="/dashboard" icon={LayoutGrid} label={d.nav.dashboard} onClick={() => setOpen(false)} />
              )}
              <div className="h-px bg-line" />
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10">
                  <LogOut className="size-4" /> {d.auth.logout}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ href, icon: Icon, label, onClick }: { href: string; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-fg-soft transition-colors hover:bg-fg/[0.05] hover:text-fg">
      <Icon className="size-4" /> {label}
    </Link>
  );
}
