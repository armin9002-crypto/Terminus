import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {}

export const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, 'aria-label': ariaLabel, 'aria-describedby': ariaDescription, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-[var(--border)]">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={ariaLabel} aria-describedby={ariaDescription} className="block size-4 rounded-full border border-accent bg-primaryText focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
    </SliderPrimitive.Root>
  ),
);

Slider.displayName = "Slider";
