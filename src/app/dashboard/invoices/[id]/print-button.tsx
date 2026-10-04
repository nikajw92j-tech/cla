"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser print dialog — "Save as PDF" produces the invoice download. */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()} icon={<Download className="size-4" />}>
      {label}
    </Button>
  );
}
