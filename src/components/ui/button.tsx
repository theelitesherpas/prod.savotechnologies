import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "group/btn inline-flex items-center justify-center gap-2.5 rounded-[2px] font-sans font-semibold tracking-[-0.01em] whitespace-nowrap transition-colors duration-300 ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  solid:
    "bg-foreground text-background hover:bg-accent hover:text-on-accent",
  outline:
    "border border-foreground/25 text-foreground hover:border-foreground hover:bg-foreground/[0.04]",
  ghost:
    "text-foreground hover:text-accent",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

/** Arrow that nudges on hover - used inside buttons and links. */
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 14 14"
      className={cn(
        "h-3 w-3 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/btn:translate-x-[3px]",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
    </svg>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
