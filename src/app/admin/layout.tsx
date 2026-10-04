import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [threads, notifications] = await Promise.all([
    db.thread.aggregate({ _sum: { unreadByAdmin: true } }),
    db.notification.count({ where: { userId: admin.id, readAt: null } }),
  ]);
  return (
    <DashboardShell
      mode="admin"
      user={{
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        avatar: admin.profile?.avatarFileId ? `/api/files/${admin.profile.avatarFileId}` : null,
        isPro: false,
        role: admin.role,
      }}
      counts={{ messages: threads._sum.unreadByAdmin ?? 0, notifications }}
    >
      {children}
    </DashboardShell>
  );
}
