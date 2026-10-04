import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { Badge, Card, FormattedDate, PageHeader } from "@/components/ui/misc";
import { ActionButton } from "@/components/dashboard/action-button";
import { adminReviewAction } from "@/app/actions/admin";

export default async function AdminReviews() {
  const { d } = await getI18n();
  const a = d.admin;
  const reviews = await db.review.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHeader title={a.nav.reviews} />
      <div className="grid gap-4 lg:grid-cols-2">
        {reviews.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-fg">{r.displayName}</p>
                <p className="text-xs text-muted">
                  {r.projectType} · <FormattedDate value={r.createdAt} />
                </p>
              </div>
              <div className="flex gap-1.5">
                {r.featured && <Badge tone="violet">★</Badge>}
                <Badge tone={r.approved ? "green" : "amber"}>{r.approved ? a.approved : a.pendingReview}</Badge>
              </div>
            </div>
            <div className="mt-3 flex gap-0.5" aria-label={`${r.rating}/5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-4 ${i < r.rating ? "fill-gold text-gold" : "text-fg/15"}`} />
              ))}
            </div>
            <p className="mt-3 text-sm text-fg-soft">{r.body}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <ActionButton action={adminReviewAction.bind(null, r.id, r.approved ? "hide" : "approve")} size="sm" variant={r.approved ? "secondary" : "primary"}>
                {r.approved ? a.unapprove : a.approve}
              </ActionButton>
              <ActionButton action={adminReviewAction.bind(null, r.id, "feature")} size="sm" variant="secondary">
                {a.feature}
              </ActionButton>
              <ActionButton action={adminReviewAction.bind(null, r.id, "delete")} size="sm" variant="danger" confirm={`${d.common.delete}?`}>
                {d.common.delete}
              </ActionButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
