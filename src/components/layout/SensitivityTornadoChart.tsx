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
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const [bars, setBars] = useState<TornadoBar[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!results) return;
    setLoading(true);
    setBars([]);

    const n = 250;
    const base = results.successRate;

    setTimeout(() => {
      const perturbations: Array<{
        label: string;
        upLabel: string;
        downLabel: string;
        upInputs: typeof inputs;
        downInputs: typeof inputs;
      }> = [
        {
          label: "Expected Return",
          upLabel: "+1%",
          downLabel: "-1%",
          upInputs: { ...inputs, expectedReturn: inputs.expectedReturn + 0.01, numSimulations: n },
          downInputs: { ...inputs, expectedReturn: Math.max(0.01, inputs.expectedReturn - 0.01), numSimulations: n },
        },
        {
          label: "Inflation Rate",
          upLabel: "+0.5%",
          downLabel: "-0.5%",
          upInputs: { ...inputs, inflationRate: inputs.inflationRate + 0.005, numSimulations: n },
          downInputs: { ...inputs, inflationRate: Math.max(0, inputs.inflationRate - 0.005), numSimulations: n },
        },
        {
          label: "Annual Spending",
          upLabel: "+20%",
          downLabel: "-20%",
          upInputs: { ...inputs, spendingGoGo: inputs.spendingGoGo * 1.2, spendingSlowGo: inputs.spendingSlowGo * 1.2, spendingNoGo: inputs.spendingNoGo * 1.2, numSimulations: n },
          downInputs: { ...inputs, spendingGoGo: inputs.spendingGoGo * 0.8, spendingSlowGo: inputs.spendingSlowGo * 0.8, spendingNoGo: inputs.spendingNoGo * 0.8, numSimulations: n },
        },
        {
          label: "Retirement Age",
          upLabel: "+3 years",
          downLabel: "-3 years",
          upInputs: { ...inputs, retirementAge: Math.min(inputs.planningAge - 1, inputs.retirementAge + 3), numSimulations: n },
          downInputs: { ...inputs, retirementAge: Math.max(inputs.currentAge + 1, inputs.retirementAge - 3), numSimulations: n },
        },
        {
          label: "Social Security Benefit",
          upLabel: "+20%",
          downLabel: "-20%",
          upInputs: { ...inputs, socialSecurityAmount: inputs.socialSecurityAmount * 1.2, spouseSocialSecurityAmount: inputs.spouseSocialSecurityAmount * 1.2, numSimulations: n },
          downInputs: { ...inputs, socialSecurityAmount: inputs.socialSecurityAmount * 0.8, spouseSocialSecurityAmount: inputs.spouseSocialSecurityAmount * 0.8, numSimulations: n },
        },
        {
          label: "Portfolio Volatility",
          upLabel: "+5%",
          downLabel: "-5%",
          upInputs: { ...inputs, volatility: Math.min(0.4, inputs.volatility + 0.05), numSimulations: n },
          downInputs: { ...inputs, volatility: Math.max(0.01, inputs.volatility - 0.05), numSimulations: n },
        },
        {
          label: "Carry Realization",
          upLabel: "+25% capture",
          downLabel: "No carry",
          upInputs: { ...inputs, carryAwards: inputs.carryAwards.map(a => ({ ...a, poolValueCapture: Math.min(1, a.poolValueCapture + 0.25) })), numSimulations: n },
          downInputs: { ...inputs, carryAwards: [], numSimulations: n },
        },
      ];

      const computed: TornadoBar[] = perturbations.map(p => {
        const upRate = runSimulation(p.upInputs).successRate;
        const downRate = runSimulation(p.downInputs).successRate;
        const upDelta = upRate - base;
        const downDelta = downRate - base;
        return {
          label: p.label,
          upLabel: p.upLabel,
          downLabel: p.downLabel,
          upDelta,
          downDelta,
          absMax: Math.max(Math.abs(upDelta), Math.abs(downDelta)),
        };
      });

      // Sort by absolute impact descending
      computed.sort((a, b) => b.absMax - a.absMax);
      setBars(computed);
      setLoading(false);
    }, 0);
  }, [results?.successRate, inputs.retirementAge, inputs.spendingGoGo, inputs.expectedReturn]);

  if (!results) {
    return <p className="text-sm text-[var(--text-muted)] text-center py-8">Run the simulation to see sensitivity analysis.</p>;
  }

  const MAX_BAR_WIDTH = 160; // px, per side

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Sensitivity Analysis</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Impact on success rate from changing each input. Bars show the delta from the base case of{" "}
          <span className="font-bold text-[var(--accent)]">{formatPercentage(results.successRate, 1)}</span>.
          Sorted by largest absolute impact.
        </p>
      </div>

      {loading && (
        <div className="grid gap-3 py-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-10 animate-pulse rounded bg-[var(--border)]" />
          ))}
          <p className="text-xs text-[var(--text-muted)] text-center">Running 14 scenario comparisons...</p>
        </div>
      )}

      {!loading && bars.length > 0 && (
        <div className="grid gap-2">
          {/* Column headers */}
          <div className="grid items-center" style={{ gridTemplateColumns: `1fr ${MAX_BAR_WIDTH}px 1px ${MAX_BAR_WIDTH}px` }}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Input</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--danger)] text-right pr-2">Worse</span>
            <div />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--success)] pl-2">Better</span>
          </div>

          {bars.map((bar) => {
            const globalMax = bars[0]?.absMax ?? 0.01;
            const upWidth = Math.round((Math.abs(bar.upDelta) / globalMax) * MAX_BAR_WIDTH);
            const downWidth = Math.round((Math.abs(bar.downDelta) / globalMax) * MAX_BAR_WIDTH);
            const upIsGood = bar.upDelta > 0;
            const downIsGood = bar.downDelta > 0;

            return (
              <div key={bar.label} className="grid items-center gap-2" style={{ gridTemplateColumns: `1fr ${MAX_BAR_WIDTH}px 1px ${MAX_BAR_WIDTH}px` }}>
                {/* Label */}
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{bar.label}</p>
                </div>

                {/* Left side (down scenario) */}
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] tabular-nums text-[var(--text-muted)] shrink-0">
                    {bar.downDelta > 0 ? "+" : ""}{formatPercentage(bar.downDelta, 1)} ({bar.downLabel})
                  </span>
                  <div className="h-5 rounded-l-sm" style={{
                    width: downWidth,
                    background: downIsGood ? "var(--success)" : "var(--danger)",
                    opacity: 0.8,
                    minWidth: bar.downDelta !== 0 ? 4 : 0,
                  }} />
                </div>

                {/* Center line */}
                <div className="w-px h-7 bg-[var(--border)]" />

                {/* Right side (up scenario) */}
                <div className="flex items-center gap-1">
                  <div className="h-5 rounded-r-sm" style={{
                    width: upWidth,
                    background: upIsGood ? "var(--success)" : "var(--danger)",
                    opacity: 0.8,
                    minWidth: bar.upDelta !== 0 ? 4 : 0,
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
        Each scenario runs 250 paths for speed; base case uses {results ? inputs.numSimulations.toLocaleString() : "--"} paths,
        so small deltas may reflect sampling variance rather than true sensitivity.
        Focus on the relative ranking and magnitude rather than precise decimal values.
      </p>
    </div>
  );
}