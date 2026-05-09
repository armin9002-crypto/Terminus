import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-border bg-[#101522] px-3 text-sm text-primaryText outline-none transition placeholder:text-slate-600 focus:border-accent focus:ring-2 focus:ring-accent/15",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
