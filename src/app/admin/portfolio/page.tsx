import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { Card, CardHeader, PageHeader } from "@/components/ui/misc";
import { PortfolioForm } from "./form";

export default async function AdminPortfolio() {
  const { d } = await getI18n();
  const items = await db.portfolioProject.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title={d.admin.nav.portfolio} />
      <Card className="mb-6">
        <CardHeader title={d.admin.addProject} />
        <div className="p-5">
          <PortfolioForm />
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {items.map((p) => (
          <Card key={p.id}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ background: p.accent }} /> {p.title}
                </span>
              }
              subtitle={p.category}
            />
            <div className="p-5">
              <PortfolioForm item={p} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
