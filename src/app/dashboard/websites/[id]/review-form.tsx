"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { ActionForm, Input, SubmitButton, Textarea } from "@/components/ui/form";
import { submitReviewAction } from "@/app/actions/account";
import { cn } from "@/lib/utils";

export function ReviewForm({ websiteId, defaultName, defaultType }: { websiteId: string; defaultName: string; defaultType: string }) {
  const { d } = useApp();
  const w = d.websites;
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  return (
    <ActionForm action={submitReviewAction} className="space-y-4">
      <input type="hidden" name="websiteId" value={websiteId} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <p className="mb-2 text-sm font-medium text-fg-soft">{w.rating}</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n}/5`} className="transition-transform hover:scale-110 active:scale-95">
              <Star className={cn("size-7", n <= (hover || rating) ? "fill-gold text-gold" : "text-fg/20")} />
            </button>
          ))}
        </div>
      </div>
      <Textarea name="body" label={w.reviewText} rows={4} maxLength={1500} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="displayName" label={w.displayName} defaultValue={defaultName} maxLength={80} />
        <Input name="projectType" label={w.projectType} defaultValue={defaultType} maxLength={80} />
      </div>
      <SubmitButton>{w.sendReview}</SubmitButton>
    </ActionForm>
  );
}
