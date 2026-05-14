import { useState, useEffect } from "react";
import { runSimulation } from "../../engine/monteCarlo";
import { formatPercentage } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";

interface TornadoBar {
  label: string;
  upLabel: string;
  downLabel: string;
  upDelta: number;
  downDelta: number;
  absMax: number;
}

export function SensitivityTornadoChart() {
  const inputs = useSimStore((s) => s.inputs);
  const results = useSimStore((s) => s.results);
  const [bars, setBars] = useState<TornadoBar[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!results) return;
    setLoading(true);
    setBars([]);

    const n = 250;
    const base = results.successRate;

    setTimeout(() => {
      const specs: Array<{
        label: string; upLabel: string; downLabel: string;
        up: typeof inputs; down: typeof inputs;
      }> = [
        {
          label: "Expected Return", upLabel: "+1%", downLabel: "-1%",
          up: { ...inputs, expectedReturn: inputs.expectedReturn + 0.01, numSimulations: n },
          down: { ...inputs, expectedReturn: Math.max(0.01, inputs.expectedReturn - 0.01), numSimulations: n },
        },
        {
          label: "Inflation Rate", upLabel: "+0.5%", downLabel: "-0.5%",
          up: { ...inputs, inflationRate: inputs.inflationRate + 0.005, numSimulations: n },
          down: { ...inputs, inflationRate: Math.max(0, inputs.inflationRate - 0.005), numSimulations: n },
        },
        {
          label: "Annual Spending", upLabel: "+20%", downLabel: "-20%",
          up: { ...inputs, spendingGoGo: inputs.spendingGoGo * 1.2, spendingSlowGo: inputs.spendingSlowGo * 1.2, spendingNoGo: inputs.spendingNoGo * 1.2, numSimulations: n },
          down: { ...inputs, spendingGoGo: inputs.spendingGoGo * 0.8, spendingSlowGo: inputs.spendingSlowGo * 0.8, spendingNoGo: inputs.spendingNoGo * 0.8, numSimulations: n },
        },
        {
          label: "Retirement Age", upLabel: "+3 years", downLabel: "-3 years",
          up: { ...inputs, retirementAge: Math.min(inputs.planningAge - 1, inputs.retirementAge + 3), numSimulations: n },
          down: { ...inputs, retirementAge: Math.max(inputs.currentAge + 1, inputs.retirementAge - 3), numSimulations: n },
        },
        {
          label: "Social Security", upLabel: "+20%", downLabel: "-20%",
          up: { ...inputs, socialSecurityAmount: inputs.socialSecurityAmount * 1.2, spouseSocialSecurityAmount: inputs.spouseSocialSecurityAmount * 1.2, numSimulations: n },
          down: { ...inputs, socialSecurityAmount: inputs.socialSecurityAmount * 0.8, spouseSocialSecurityAmount: inputs.spouseSocialSecurityAmount * 0.8, numSimulations: n },
        },
        {
          label: "Portfolio Volatility", upLabel: "+5%", downLabel: "-5%",
          up: { ...inputs, volatility: Math.min(0.4, inputs.volatility + 0.05), numSimulations: n },
          down: { ...inputs, volatility: Math.max(0.01, inputs.volatility - 0.05), numSimulations: n },
        },
        {
          label: "Carry Realization", upLabel: "+25% capture", downLabel: "No carry",
          up: { ...inputs, carryAwards: inputs.carryAwards.map(a => ({ ...a, poolValueCapture: Math.min(1, a.poolValueCapture + 0.25) })), numSimulations: n },
          down: { ...inputs, carryAwards: [], numSimulations: n },
        },
      ];

      const computed: TornadoBar[] = specs.map(s => {
        const upRate = runSimulation(s.up).successRate;
        const downRate = runSimulation(s.down).successRate;
        const upDelta = upRate - base;
        const downDelta = downRate - base;
        return { label: s.label, upLabel: s.upLabel, downLabel: s.downLabel, upDelta, downDelta, absMax: Math.max(Math.abs(upDelta), Math.abs(downDelta)) };
      });

      computed.sort((a, b) => b.absMax - a.absMax);
      setBars(computed);
      setLoading(false);
    }, 0);
  }, [results?.successRate, inputs.retirementAge, inputs.spendingGoGo, inputs.expectedReturn]);

  if (!results) {
    return <p className="text-sm text-[var(--text-muted)] text-center py-8">Run the simulation to see sensitivity analysis.</p>;
  }

  const MAX_PX = 160;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Sensitivity Analysis -- Tornado Chart</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Impact on success rate from changing each input. Base case:{" "}
          <span className="font-bold text-[var(--accent)]">{formatPercentage(results.successRate, 1)}</span>.
          Sorted by largest absolute impact. Green = improvement, red = deterioration.
        </p>
      </div>

      {loading && (
        <div className="grid gap-3 py-4">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="h-10 animate-pulse rounded bg-[var(--border)]" />
          ))}
          <p className="text-xs text-[var(--text-muted)] text-center">Running 14 scenario comparisons (250 paths each)...</p>
        </div>
      )}

      {!loading && bars.length > 0 && (
        <div className="grid gap-2">
          <div className="grid items-center gap-2" style={{ gridTemplateColumns: `160px ${MAX_PX}px 1px ${MAX_PX}px` }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Input</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--danger)] text-right pr-2">Worse</span>
            <div />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--success)] pl-2">Better</span>
          </div>

          {bars.map((bar) => {
            const globalMax = bars[0]?.absMax ?? 0.01;
            const upW = Math.round((Math.abs(bar.upDelta) / globalMax) * MAX_PX);
            const downW = Math.round((Math.abs(bar.downDelta) / globalMax) * MAX_PX);
            const upGood = bar.upDelta > 0;
            const downGood = bar.downDelta > 0;
            return (
              <div key={bar.label} className="grid items-center gap-2" style={{ gridTemplateColumns: `160px ${MAX_PX}px 1px ${MAX_PX}px` }}>
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{bar.label}</p>

                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)] shrink-0">
                    {bar.downDelta > 0 ? "+" : ""}{formatPercentage(bar.downDelta, 1)} ({bar.downLabel})
                  </span>
                  <div className="h-5 rounded-l-sm flex-shrink-0" style={{
                    width: Math.max(downW, bar.downDelta !== 0 ? 4 : 0),
                    background: downGood ? "var(--success)" : "var(--danger)",
                    opacity: 0.8,
                  }} />
                </div>

                <div className="w-px h-7 bg-[var(--border)]" />

                <div className="flex items-center gap-1">
                  <div className="h-5 rounded-r-sm flex-shrink-0" style={{
                    width: Math.max(upW, bar.upDelta !== 0 ? 4 : 0),
                    background: upGood ? "var(--success)" : "var(--danger)",
                    opacity: 0.8,
                  }} />
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)] shrink-0">
                    {bar.upDelta > 0 ? "+" : ""}{formatPercentage(bar.upDelta, 1)} ({bar.upLabel})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[var(--text-muted)]">
        Each scenario uses 250 paths for speed. Small deltas may reflect sampling noise rather than
        true sensitivity. Focus on the relative ranking and magnitude, not precise decimal values.
      </p>
    </div>
  );
}