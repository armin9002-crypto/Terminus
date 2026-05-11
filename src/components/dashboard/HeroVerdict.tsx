import { useState, useEffect } from "react";
import { getInvestableAssets, solveSustainableSpend } from "../../engine/monteCarlo";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import type { SimInputs, SimResults } from "../../types";

interface HeroVerdictProps {
  inputs: SimInputs;
  results: SimResults | null;
}

function tone(successRate: number) {
  if (successRate >= 0.85) return { border: "border-l-success", text: "text-success" };
  if (successRate >= 0.7) return { border: "border-l-warning", text: "text-warning" };
  return { border: "border-l-danger", text: "text-danger" };
}

export function HeroVerdict({ inputs, results }: HeroVerdictProps) {
  const successRate = results?.successRate;
  const activeTone = tone(successRate ?? 0);
  
  const [sustainableSpend, setSustainableSpend] = useState<number | null>(null);

  useEffect(() => {
    if (!results) {
      setSustainableSpend(null);
      return;
    }
    const timer = setTimeout(() => {
      const spend = solveSustainableSpend(inputs);
      setSustainableSpend(spend);
    }, 600);
    return () => clearTimeout(timer);
  }, [results?.successRate, inputs.retirementAge, inputs.planningAge, inputs.taxableAssets, inputs.taxDeferredAssets, inputs.taxFreeAssets]);

  return (
    <section className={cn("min-h-[120px] rounded-lg border border-border border-l-4 bg-card p-5 shadow-terminal", activeTone.border)}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mutedText">Live verdict</p>
          <h1 className="mt-2 text-[22px] font-bold leading-tight text-primaryText md:text-3xl">
            You can sustain {formatCompactCurrency(inputs.spendingGoGo)}/year with{" "}
            <span className={cn("transition-all duration-300", activeTone.text)}>
              {successRate === undefined ? "--" : formatPercentage(successRate, 0)}
            </span>{" "}
            confidence through age {inputs.planningAge}
          </h1>
          <p className="mt-2 text-sm font-semibold" style={{color: 'var(--accent)'}}>
            Safe sustainable spend at 85% confidence: 
            {sustainableSpend ? `${formatCompactCurrency(sustainableSpend * 12)}/year | ${formatCompactCurrency(sustainableSpend)}/month` : "--"}
          </p>
          <p className="mt-3 text-sm text-mutedText">
            Retiring at {inputs.retirementAge} / {formatCompactCurrency(getInvestableAssets(inputs))} investable /{" "}
            {inputs.numSimulations.toLocaleString()} simulations / Live model
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Pill label="Success Rate" value={successRate === undefined ? "--" : formatPercentage(successRate, 0)} className={activeTone.text} />
          <Pill label="Median Terminal" value={results ? formatCompactCurrency(results.medianTerminalWealth) : "--"} />
          <Pill label="Ruin Prob." value={results ? formatPercentage(results.ruinProbability, 0) : "--"} className={results && results.ruinProbability > 0.2 ? "text-danger" : ""} />
        </div>
      </div>
    </section>
  );
}

function Pill({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border border-border bg-[var(--bg-card)] p-3 text-center">
      <p className={cn("text-2xl font-bold transition-all duration-300", className)}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-mutedText">{label}</p>
    </div>
  );
}
