import { useMemo } from "react";
import { STRESS_SCENARIOS } from "@/lib/constants";
import { runSimulation } from "@/engine/monteCarlo";
import { formatCompactCurrency, formatPercentage } from "@/lib/formatters";
import { useSimStore } from "@/store/useSimStore";

export function StressTestChart() {
  const inputs = useSimStore((state) => state.inputs);
  const rows = useMemo(() => STRESS_SCENARIOS.map((scenario) => {
    const result = runSimulation({ ...inputs, numSimulations: Math.min(inputs.numSimulations, 1000) }, scenario);
    const last = result.percentilePaths[result.percentilePaths.length - 1];
    return { scenario, result, p10: last?.p10 ?? 0 };
  }), [inputs]);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-[#111827] p-3 text-xs font-bold uppercase tracking-[0.16em] text-mutedText">
        <span>Scenario</span><span>Success</span><span>Median</span><span>10th pct.</span>
      </div>
      {rows.map((row) => (
        <div key={row.scenario.key} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-t border-border p-3 text-sm">
          <span className="font-semibold text-primaryText">{row.scenario.label}</span>
          <span className={row.result.successRate >= 0.85 ? "text-success" : row.result.successRate >= 0.7 ? "text-warning" : "text-danger"}>{formatPercentage(row.result.successRate, 0)}</span>
          <span className="text-mutedText">{formatCompactCurrency(row.result.medianTerminalWealth)}</span>
          <span className={row.p10 <= 0 ? "text-danger" : "text-mutedText"}>{formatCompactCurrency(row.p10)}</span>
        </div>
      ))}
    </div>
  );
}
