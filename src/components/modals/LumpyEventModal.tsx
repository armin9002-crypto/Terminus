import { Button } from "@/components/ui/button";
import { useSimStore } from "@/store/useSimStore";

export function LumpyEventModal() {
  const addLumpyEvent = useSimStore((state) => state.addLumpyEvent);
  const currentAge = useSimStore((state) => state.inputs.currentAge);

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() =>
        addLumpyEvent({
          id: crypto.randomUUID(),
          label: "New liquidity event",
          year: currentAge + 8,
          amount: 500_000,
          probability: 0.5,
          taxType: "ltcg",
          confidence: "medium",
        })
      }
    >
      Add lumpy event
    </Button>
  );
}
