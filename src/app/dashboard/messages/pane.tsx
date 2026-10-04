"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** On mobile, show either the thread list or the open thread — never both squeezed together. */
export function MessagesPane({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const inThread = /^\/(dashboard|admin)\/messages\/.+/.test(usePathname());
  return (
    <>
      <div className={cn(inThread && "hidden lg:block")}>{list}</div>
      <div className={cn(!inThread && "hidden lg:block")}>{children}</div>
    </>
  );
}
