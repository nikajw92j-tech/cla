import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { CurrencySelect, LanguageSelect, ThemeToggle } from "@/components/site/pref-switchers";
import { logoutAllAction } from "@/app/actions/account";
import { NotificationPrefsForm, PasswordForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.settings.title };
}

export default async function SettingsPage() {
  const user = await requireUser();
  const { d } = await getI18n();
  const p = user.profile;
  return (
    <>
      <PageHeader title={d.settings.title} subtitle={d.settings.subtitle} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={d.settings.preferences} />
          <div className="divide-y divide-line px-6">
            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-medium text-fg">{d.nav.language}</span>
              <LanguageSelect />
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-medium text-fg">{d.nav.currency}</span>
              <CurrencySelect />
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-medium text-fg">{d.nav.theme}</span>
              <ThemeToggle />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title={d.settings.notifications} />
          <div className="px-6 pb-4">
            <NotificationPrefsForm
              defaults={{
                emailOnStatus: p?.emailOnStatus ?? true,
                emailOnMessages: p?.emailOnMessages ?? true,
                emailOnBilling: p?.emailOnBilling ?? true,
                emailMarketing: p?.emailMarketing ?? false,
              }}
            />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={d.settings.security} />
          <div className="grid gap-8 p-6 lg:grid-cols-[1.4fr_1fr]">
            <PasswordForm />
            <div className="rounded-2xl border border-line p-5">
              <p className="font-medium text-fg">{d.settings.logoutAll}</p>
              <p className="mt-1 text-sm text-muted">{d.settings.logoutAllDesc}</p>
              <form action={logoutAllAction}>
                <Button type="submit" variant="danger" className="mt-4" icon={<LogOut className="size-4" />}>
                  {d.settings.logoutAll}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
