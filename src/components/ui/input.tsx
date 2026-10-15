import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full min-w-0 rounded-[10px] border border-[var(--control-line)] bg-[var(--surface-inset)] px-3 text-base text-primaryText placeholder:text-mutedText focus:border-accent",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
