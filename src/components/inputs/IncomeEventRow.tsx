import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LumpyEvent } from "@/types";
import { formatCompactCurrency } from "@/lib/formatters";

interface IncomeEventRowProps {
  event: LumpyEvent;
  onRemove: (id: string) => void;
}

export function IncomeEventRow({ event, onRemove }: IncomeEventRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-white/[0.03] p-3">
      <div>
        <p className="text-sm font-semibold text-primaryText">{event.label}</p>
        <p className="mt-1 text-xs text-mutedText">
          Age {event.year} · {formatCompactCurrency(event.amount)} · {(event.probability * 100).toFixed(0)}%
        </p>
      </div>
      <Button variant="ghost" className="size-8 px-0" aria-label={`Remove ${event.label}`} onClick={() => onRemove(event.id)}>
        <Trash2 size={15} />
      </Button>
    </div>
  );
}
