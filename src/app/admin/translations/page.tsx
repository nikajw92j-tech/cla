import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { Table, Td } from "@/components/admin/table";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminDeleteTranslationAction } from "@/app/actions/admin";
import { TranslationForm } from "./form";

export default async function AdminTranslations() {
  const { d } = await getI18n();
  const a = d.admin;
  const overrides = await db.translationOverride.findMany({ orderBy: [{ key: "asc" }, { locale: "asc" }] });
  return (
    <>
      <PageHeader title={a.nav.translations} subtitle="ka · en · ru" />
      <Card className="mb-6">
        <CardHeader title={a.overrides} />
        <div className="p-5">
          <TranslationForm />
        </div>
      </Card>
      <Table head={["", a.translationKey, a.translationValue, ""]} minWidth={640}>
        {overrides.map((o) => (
          <tr key={o.id}>
            <Td className="font-mono text-xs uppercase">{o.locale}</Td>
            <Td className="font-mono text-xs">{o.key}</Td>
            <Td className="text-fg-soft">{o.value}</Td>
            <Td>
              <ActionButton action={adminDeleteTranslationAction.bind(null, o.id)} size="sm" variant="ghost">
                {d.common.delete}
              </ActionButton>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
