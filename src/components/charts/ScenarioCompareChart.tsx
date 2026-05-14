import { useState, useEffect } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { runSimulation, solveSustainableSpend } from "../../engine/monteCarlo";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";
import type { PercentilesAtAge, SimResults } from "../../types";

const scenarios = [
  { name: "Retire at 52", retirementAge: 52, color: "#14b8a6" },
  { name: "Retire at 55", retirementAge: 55, color: "#22c55e" },
  { name: "Retire at 58", retirementAge: 58, color: "#f59e0b" },
];

interface ScenarioResult {
  name: string;
  retirementAge: number;
  color: string;
  result: SimResults;
  monthlySpend: number;
}

export function ScenarioCompareChart() {
  const inputs = useSimStore((state) => state.inputs);
  const [noCarry, setNoCarry] = useState(false);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    setLoading(true);
    const baseInputs = noCarry ? { ...inputs, carryAwards: [] } : inputs;
    const reducedInputs = { ...baseInputs, numSimulations: Math.min(baseInputs.numSimulations, 750) };
    
    let index = 0;
    const finalResults: ScenarioResult[] = [];

    function runNext() {
      if (cancelled) return;
      if (index >= scenarios.length) {
        setScenarioResults(finalResults);
        setLoading(false);
        return;
      }

      const scenario = scenarios[index];
      const result = runSimulation({ ...reducedInputs, retirementAge: scenario.retirementAge });
      const monthlySpend = solveSustainableSpend({ ...reducedInputs, retirementAge: scenario.retirementAge });
      
      finalResults.push({ ...scenario, result, monthlySpend });
      index++;
      timeoutId = window.setTimeout(runNext, 0);
    }

    timeoutId = window.setTimeout(runNext, 0);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [inputs, noCarry]);

  const chartData = scenarioResults[0]?.result?.percentilePaths?.map((point: PercentilesAtAge, index: number) => ({
    age: point.age,
    retire52: scenarioResults[0]?.result.percentilePaths[index]?.p50 ?? 0,
    retire55: scenarioResults[1]?.result.percentilePaths[index]?.p50 ?? 0,
    retire58: scenarioResults[2]?.result.percentilePaths[index]?.p50 ?? 0,
  })) ?? [];

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-lg bg-slate-700/30" />
          <div className="h-32 animate-pulse rounded-lg bg-slate-700/30" />
          <div className="h-32 animate-pulse rounded-lg bg-slate-700/30" />
        </div>
        <p className="text-center text-sm text-[var(--text-muted)]">Computing scenarios...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-[var(--bg-card)] p-3">
        <span className="text-sm font-semibold text-primaryText">What if carry never comes?</span>
        <button className="rounded-full border border-border px-3 py-1 text-sm text-mutedText" onClick={() => setNoCarry((value) => !value)}>
          {noCarry ? "No carry" : "Base carry"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {scenarioResults.map((scenario) => (
          <div key={scenario.name} className="rounded-lg border border-border bg-[var(--bg-card)] p-4">
            <p className="text-sm font-semibold text-primaryText">{scenario.name}</p>
            <p className="mt-3 text-3xl font-bold" style={{ color: scenario.color }}>{formatPercentage(scenario.result.successRate, 0)}</p>
            <p className="mt-1 text-xs text-mutedText">Success rate</p>
            <div className="mt-4 grid gap-2 text-sm text-mutedText">
              <span>Median terminal: <strong className="text-primaryText">{formatCompactCurrency(scenario.result.medianTerminalWealth)}</strong></span>
              <span>85% monthly spend: <strong className="text-primaryText">{formatCompactCurrency(scenario.monthlySpend)}</strong></span>
            </div>
          </div>
        ))}
      </div>
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#2d3748" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#2d3748" }} />
            <YAxis tickFormatter={formatCompactCurrency} tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} width={78} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #2d3748", color: "#f1f5f9" }} formatter={(value) => formatCompactCurrency(Number(value))} />
            <Line dataKey="retire52" name="Retire at 52" stroke="#14b8a6" strokeWidth={2} dot={false} />
            <Line dataKey="retire55" name="Retire at 55" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line dataKey="retire58" name="Retire at 58" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
