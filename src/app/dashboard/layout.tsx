import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser, isProActive } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/shell";
import { VerifyBanner } from "@/components/dashboard/verify-banner";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const [threads, notifications] = await Promise.all([
    db.thread.aggregate({ where: { userId: user.id }, _sum: { unreadByUser: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return (
    <DashboardShell
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: user.profile?.avatarFileId ? `/api/files/${user.profile.avatarFileId}` : null,
        isPro: isProActive(user),
        role: user.role,
      }}
      counts={{ messages: threads._sum.unreadByUser ?? 0, notifications }}
    >
      {!user.emailVerified && <VerifyBanner />}
      {children}
    </DashboardShell>
  );
}
