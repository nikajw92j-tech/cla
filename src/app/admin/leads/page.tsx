import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { safeJson } from "@/lib/utils";
import { FormattedDate, Money, PageHeader, T } from "@/components/ui/misc";
import { Table, Td } from "@/components/admin/table";

export default async function AdminLeads() {
  const { d } = await getI18n();
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <>
      <PageHeader title={d.admin.nav.leads} subtitle={d.estimate.title} />
      <Table head={[d.estimate.name, d.estimate.email, d.wizard.s2.websiteType, d.wizard.s5.features, d.wizard.s2.pages, d.admin.leadEstimate, d.common.date]}>
        {leads.map((l) => (
          <tr key={l.id}>
            <Td className="font-medium text-fg">{l.name}</Td>
            <Td>
              <a href={`mailto:${l.email}`} className="text-brand hover:underline">
                {l.email}
              </a>
            </Td>
            <Td>
              <T k={`labels.websiteType.${l.websiteType}`} />
            </Td>
            <Td className="max-w-56 text-xs text-fg-soft">
              {safeJson<string[]>(l.features, [])
                .map((f) => d.labels.feature[f as keyof typeof d.labels.feature] ?? f)
                .join(", ")}
            </Td>
            <Td>{l.pages}</Td>
            <Td>
              <span className="capitalize">{l.recommended}</span> · <Money gel={l.estimateGel} approx={false} />
            </Td>
            <Td className="text-muted">
              <FormattedDate value={l.createdAt} />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
