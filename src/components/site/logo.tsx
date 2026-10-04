import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Nexora — home">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-[#0b0c14] ring-1 ring-white/10 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
        <span className="absolute inset-0 animate-spin-slow bg-[conic-gradient(from_0deg,transparent,rgba(139,123,255,0.5),transparent_40%)]" />
        <svg viewBox="0 0 64 64" className="relative size-6" aria-hidden>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8b7bff" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path d="M14 50V14h8l20 23V14h8v36h-8L22 27v23z" fill="url(#lg)" />
        </svg>
      </span>
      <span className="font-display text-[1.15rem] font-semibold tracking-tight text-fg">
        nexora<span className="text-brand">.</span>
      </span>
    </Link>
  );
}
