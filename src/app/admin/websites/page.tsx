import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { FormattedDate, PageHeader, ProgressBar, StatusBadge } from "@/components/ui/misc";
import { Table, Td } from "@/components/admin/table";

export default async function AdminWebsites() {
  const { d } = await getI18n();
  const sites = await db.website.findMany({ orderBy: { updatedAt: "desc" }, include: { user: true } });
  return (
    <>
      <PageHeader title={d.admin.nav.websites} />
      <Table head={[d.admin.nav.websites, d.admin.customer, d.admin.stage, d.admin.progress, d.common.status, d.admin.eta]}>
        {sites.map((s) => (
          <tr key={s.id}>
            <Td>
              <Link href={`/admin/websites/${s.id}`} className="font-medium text-fg hover:text-brand">
                {s.name}
              </Link>
            </Td>
            <Td className="text-fg-soft">
              {s.user.firstName} {s.user.lastName}
            </Td>
            <Td>
              <StatusBadge kind="stage" value={s.stage} />
            </Td>
            <Td className="w-40">
              <div className="flex items-center gap-2">
                <ProgressBar value={s.progress} className="h-1.5" />
                <span className="text-xs text-muted">{s.progress}%</span>
              </div>
            </Td>
            <Td>
              <StatusBadge kind="website" value={s.status} />
            </Td>
            <Td className="text-muted">{s.estimatedCompletion ? <FormattedDate value={s.estimatedCompletion} /> : "—"}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
