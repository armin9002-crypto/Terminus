
import { useState, useEffect } from "react";
import { STRESS_SCENARIOS } from "../../lib/constants";
import { runSimulation } from "../../engine/monteCarlo";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";
import type { SimResults } from "../../types";

interface ResultRow {
  scenario: typeof STRESS_SCENARIOS[number];
  result: SimResults;
  p10: number;
}

export function StressTestChart() {
  const inputs = useSimStore((state) => state.inputs);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setRows([]);
    
    // Run each scenario in a separate setTimeout to avoid blocking
    const reducedInputs = { 
      ...inputs, 
      numSimulations: Math.min(inputs.numSimulations, 500) 
    };
    
    let index = 0;
    const results: ResultRow[] = [];
    
    function runNext() {
      if (index >= STRESS_SCENARIOS.length) {
        setRows(results);
        setLoading(false);
        return;
      }
      const scenario = STRESS_SCENARIOS[index];
      const result = runSimulation(reducedInputs, scenario);
      const last = result.percentilePaths[result.percentilePaths.length - 1];
      results.push({ scenario, result, p10: last?.p10 ?? 0 });
      index++;
      setTimeout(runNext, 0); // yield to browser between each
    }
    
    setTimeout(runNext, 0);
  }, [inputs]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-700/30" />
        ))}
        <p className="text-center text-sm text-[var(--text-muted)]">Running stress tests...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-[var(--bg-secondary)] p-3 text-xs font-bold uppercase tracking-[0.16em] text-mutedText">
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
