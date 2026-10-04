"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/components/providers/app-providers";

type Datum = { label: string; value: number };

/**
 * Single-series vertical bar chart (one hue = magnitude). Thin bars with 4px rounded
 * data-ends anchored to the baseline, recessive gridlines, hover tooltip, and an
 * sr-only table so the values are never visual-only.
 */
export function ColumnChart({ data, format = (v) => String(v), title }: { data: Datum[]; format?: (v: number) => string; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = niceMax(max);
  const H = 200;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);
  return (
    <figure className="relative">
      <div className="flex gap-3">
        <div className="relative w-12 shrink-0 text-right text-[11px] text-muted" style={{ height: H }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: H - (t / nice) * H }}>
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0" style={{ height: H }} aria-hidden>
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-line" style={{ top: H - (t / nice) * H }} />
            ))}
          </div>
          <div className="relative flex items-end gap-[2px]" style={{ height: H }}>
            {data.map((d, i) => (
              <div
                key={d.label}
                className="relative flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / nice) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-10 rounded-t-[4px] bg-brand transition-opacity"
                  style={{ opacity: hover === null || hover === i ? 1 : 0.45 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg border border-line bg-card-solid px-2.5 py-1.5 text-xs whitespace-nowrap shadow-soft" style={{ bottom: `${(d.value / nice) * 100}%` }}>
                    <p className="text-muted">{d.label}</p>
                    <p className="font-semibold text-fg">{format(d.value)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-[2px]" aria-hidden>
            {data.map((d) => (
              <span key={d.label} className="flex-1 truncate text-center text-[11px] text-muted">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <DataTable title={title} data={data} format={format} />
    </figure>
  );
}

/** Horizontal single-series bars for comparing categories (labels stay readable on mobile). */
export function BarList({ data, format = (v) => String(v), title }: { data: Datum[]; format?: (v: number) => string; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <ul className="space-y-3">
        {data.map((d, i) => (
          <li key={d.label} className="group" title={`${d.label}: ${format(d.value)}`}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-fg-soft">{d.label}</span>
              <span className="font-medium text-fg tabular-nums">{format(d.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-fg/[0.06]">
              <motion.div
                className="h-full rounded-r-[4px] bg-brand group-hover:brightness-110"
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        ))}
      </ul>
      <DataTable title={title} data={data} format={format} />
    </figure>
  );
}

function DataTable({ title, data, format }: { title: string; data: Datum[]; format: (v: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{title}</caption>
      <tbody>
        {data.map((d) => (
          <tr key={d.label}>
            <th scope="row">{d.label}</th>
            <td>{format(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
function compact(v: number) {
  return v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(Math.round(v));
}

export function MoneyChart({ data, title }: { data: Datum[]; title: string }) {
  const { money } = useApp();
  return <ColumnChart data={data} title={title} format={(v) => money(v)} />;
}
