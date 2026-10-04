import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Table({ head, children, minWidth = 720, empty }: { head: ReactNode[]; children: ReactNode; minWidth?: number; empty?: ReactNode }) {
  return (
    <div className="glass overflow-hidden rounded-2xl shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              {head.map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:last-child]:border-0 [&>tr:hover]:bg-fg/[0.02]">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

/** Status filter chips driven by ?status= */
export function StatusFilter({ base, options, active, allLabel }: { base: string; options: { value: string; label: string }[]; active?: string; allLabel: string }) {
  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
      {[{ value: "", label: allLabel }, ...options].map((o) => (
        <Link
          key={o.value}
          href={o.value ? `${base}?status=${o.value}` : base}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
            (active ?? "") === o.value ? "border-brand bg-brand text-white" : "border-line text-fg-soft hover:border-line-strong",
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export function SearchBox({ action, q, placeholder }: { action: string; q?: string; placeholder: string }) {
  return (
    <form action={action} className="mb-4">
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="h-10 w-full max-w-sm rounded-xl border border-line bg-fg/[0.03] px-3.5 text-sm text-fg outline-none placeholder:text-muted focus:border-brand/50"
      />
    </form>
  );
}
