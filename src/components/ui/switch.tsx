import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-6 w-11 rounded-full bg-slate-700 transition data-[state=checked]:bg-accent",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
  </SwitchPrimitive.Root>
));

Switch.displayName = "Switch";
