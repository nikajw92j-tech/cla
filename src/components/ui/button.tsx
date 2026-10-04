import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl font-medium transition-[transform,box-shadow,background-color,color,opacity,border-color] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white shadow-[0_8px_30px_-10px_var(--brand)] hover:shadow-[0_14px_40px_-10px_var(--brand)] hover:-translate-y-0.5 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-full",
  gold: "bg-gradient-to-br from-[#f7cf73] via-[#f5b544] to-[#e08a2c] text-[#1b1203] shadow-[0_8px_30px_-10px_#f5b544] hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-10px_#f5b544]",
  secondary: "glass text-fg hover:border-line-strong hover:-translate-y-0.5",
  outline: "border border-line-strong text-fg hover:bg-fg/[0.04]",
  ghost: "text-fg-soft hover:bg-fg/[0.06] hover:text-fg",
  danger: "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type BtnProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode };

export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading ? <Loader2 className="relative size-4 animate-spin" /> : icon}
      {children != null && <span className="relative">{children}</span>}
    </button>
  );
}

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode; iconRight?: ReactNode };

export function ButtonLink({ variant = "primary", size = "md", icon, iconRight, className, children, ...rest }: LinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon && <span className="relative">{icon}</span>}
      <span className="relative">{children}</span>
      {iconRight && <span className="relative transition-transform duration-200 group-hover/btn:translate-x-0.5">{iconRight}</span>}
    </Link>
  );
}
