"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Quote, Star } from "lucide-react";
import { useApp } from "@/components/providers/app-providers";
import { SectionHeading, Reveal } from "@/components/site/motion";
import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function Faq() {
  const { d } = useApp();
  const s = d.home.faq;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} center={false} className="lg:sticky lg:top-28 lg:self-start" />
        <div className="space-y-3">
          {s.items.map((it, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={it.q} delay={i * 0.04}>
                <div className={cn("glass overflow-hidden rounded-2xl transition-colors", isOpen && "border-brand/30")}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium text-fg"
                    >
                      {it.q}
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={cn("grid size-8 shrink-0 place-items-center rounded-full border transition-colors", isOpen ? "border-brand bg-brand text-white" : "border-line text-fg-soft")}
                      >
                        <Plus className="size-4" />
                      </motion.span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-6 pb-6 leading-relaxed text-muted">{it.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type ReviewItem = { id: string; displayName: string; rating: number; body: string; projectType: string };

export function Reviews({ reviews }: { reviews: ReviewItem[] }) {
  const { d } = useApp();
  if (!reviews.length) return null;
  const s = d.home.reviews;
  return (
    <section className="py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
        <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={(i % 3) * 0.08} className="mb-5 break-inside-avoid">
              <figure className="glass relative rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1">
                <Quote className="absolute top-6 right-6 size-8 text-brand/15" />
                <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={cn("size-4", k < r.rating ? "fill-gold text-gold" : "text-fg/15")} />
                  ))}
                </div>
                <blockquote className="mt-4 leading-relaxed text-fg-soft">“{r.body}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Avatar name={r.displayName} size={40} />
                  <div>
                    <p className="text-sm font-semibold text-fg">{r.displayName}</p>
                    <p className="text-xs text-muted">{r.projectType}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
