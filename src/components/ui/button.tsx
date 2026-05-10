import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variants = {
  primary: "bg-accent text-slate-950 hover:bg-teal-300",
  secondary: "border border-border bg-white/[0.04] text-primaryText hover:bg-white/[0.08]",
  ghost: "text-mutedText hover:bg-white/[0.06] hover:text-primaryText",
  danger: "bg-danger/15 text-red-200 hover:bg-danger/25",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
