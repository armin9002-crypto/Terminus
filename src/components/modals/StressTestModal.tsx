import { Card, CardContent } from "@/components/ui/card";
import { HISTORICAL_SCENARIOS } from "@/lib/constants";

export function StressTestModal() {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-primaryText">Historical stress tests</h3>
        <p className="mt-2 text-sm leading-6 text-mutedText">
          Phase 2 will apply historical shock sequences to the current assumptions. The starter data is already centralized.
        </p>
        <div className="mt-4 grid gap-3">
          {HISTORICAL_SCENARIOS.map((scenario) => (
            <div key={scenario.name} className="rounded-md border border-border bg-white/[0.03] p-3">
              <p className="font-semibold text-primaryText">{scenario.name}</p>
              <p className="mt-1 text-sm text-mutedText">
                {scenario.startYear} · drawdown {(scenario.drawdown * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
