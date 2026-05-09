import type { LumpyEvent } from "@/types";

export function estimateEventTax(event: LumpyEvent): number {
  if (event.taxType === "ordinary") {
    return Math.max(0, event.amount * 0.4);
  }

  if (event.taxType === "ltcg") {
    return Math.max(0, event.amount * 0.24);
  }

  return 0;
}
