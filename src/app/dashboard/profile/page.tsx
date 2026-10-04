import type { Metadata } from "next";
import { requireUser, isProActive } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { fmt, formatDate } from "@/lib/i18n/format";
import { Avatar, Card, CardHeader, PageHeader, ProBadge } from "@/components/ui/misc";
import { ProfileForm, AvatarForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getI18n();
  return { title: d.profile.title };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const { d, locale } = await getI18n();
  const avatar = user.profile?.avatarFileId ? `/api/files/${user.profile.avatarFileId}` : null;
  return (
    <>
      <PageHeader title={d.profile.title} subtitle={d.profile.subtitle} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <div className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-brand opacity-40 blur-lg" />
              <Avatar src={avatar} name={`${user.firstName} ${user.lastName}`} size={112} className="relative" />
            </div>
            <p className="mt-4 flex items-center gap-2 text-lg font-semibold text-fg">
              {user.firstName} {user.lastName} {isProActive(user) && <ProBadge />}
            </p>
            <p className="text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted">{fmt(d.profile.memberSince, { date: formatDate(user.createdAt, locale) })}</p>
            <AvatarForm />
          </div>
        </Card>
        <Card>
          <CardHeader title={d.common.details} />
          <div className="p-6">
            <ProfileForm
              defaults={{
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.profile?.phone ?? "",
                company: user.profile?.company ?? "",
                country: user.profile?.country ?? "",
                bio: user.profile?.bio ?? "",
              }}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
