import { useState, useEffect, useRef } from "react";
import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { getInvestableAssets } from "../../engine/monteCarlo";

function Badge({ label, color }: { label: string; color: "success" | "warning" | "danger" | "neutral" }) {
  const colors = {
    success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
    warning: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
    danger: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20",
    neutral: "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colors[color]}`}>
      {label}
    </span>
  );
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <div className="text-right">
        <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{value}</span>
        {sub && <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>}
      </div>
    </div>
  );
}

export function ExecutiveSummary() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const successRate = results?.successRate ?? 0;
  const verdictColor = successRate >= 0.85 ? "success" : successRate >= 0.7 ? "warning" : "danger";
  const investable = getInvestableAssets(inputs);

  const totalCarryNet = inputs.carryAwards.reduce((sum, a) => {
    const gross = a.totalPoolValue * a.poolValueCapture * a.vestedPercent;
    const taxRate = Math.min(0.20 + 0.038 + inputs.stateIncomeTaxRate, 0.55);
    return sum + gross * (1 - taxRate);
  }, 0);

  const totalGPCommit = inputs.carryAwards.reduce(
    (sum, a) => sum + a.totalPoolValue * a.gpCommitPercent,
    0
  );

  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const combinedIncome = inputs.annualSalary + (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);

  async function generateSummary() {
    if (!results) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setSummary("");

    const prompt = `You are a senior financial planner writing an executive summary for a high-income professional. 
Write a comprehensive but concise executive summary (400-600 words) of their retirement plan based on these inputs and results.

PROFILE:
- Current age: ${inputs.currentAge}, retiring at ${inputs.retirementAge}, planning to age ${inputs.planningAge}
- Combined gross income: ${formatCompactCurrency(combinedIncome)}/yr
- Investable assets today: ${formatCompactCurrency(investable)}
- Asset mix: Taxable ${formatCompactCurrency(inputs.taxableAssets)}, Traditional ${formatCompactCurrency(inputs.taxDeferredAssets)}, Roth ${formatCompactCurrency(inputs.taxFreeAssets)}, Cash ${formatCompactCurrency(inputs.cashReserves)}
- Illiquid assets: ${formatCompactCurrency(inputs.illiquidAssets)}
- Mortgage balance: ${formatCompactCurrency(inputs.mortgageBalance)}, ${inputs.mortgageYearsRemaining} years remaining
- Filing status: ${inputs.filingStatus === 'mfj' ? 'Married Filing Jointly' : 'Single'}, ${inputs.numDependents} dependents
- State income tax rate: ${formatPercentage(inputs.stateIncomeTaxRate, 1)}

RETIREMENT SPENDING PLAN (today's dollars):
- Go-go years (${inputs.goGoYears} yrs): ${formatCompactCurrency(inputs.spendingGoGo)}/yr
- Slow-go years (${inputs.slowGoYears} yrs): ${formatCompactCurrency(inputs.spendingSlowGo)}/yr
- No-go years: ${formatCompactCurrency(inputs.spendingNoGo)}/yr + ${formatCompactCurrency(inputs.healthcareSurgeAmount)}/yr healthcare
- Inflation assumption: ${formatPercentage(inputs.inflationRate, 1)}

MARKET ASSUMPTIONS:
- Expected return (CAGR): ${formatPercentage(inputs.expectedReturn, 1)}
- Volatility: ${formatPercentage(inputs.volatility, 0)}

SOCIAL SECURITY:
- Claiming at age ${inputs.socialSecurityAge}
- Primary benefit: ${formatCompactCurrency(inputs.socialSecurityAmount)}/yr
${inputs.hasSpouse ? `- Spouse claiming at ${inputs.spouseSocialSecurityAge}, benefit ${formatCompactCurrency(inputs.spouseSocialSecurityAmount)}/yr` : ""}

PE CARRY:
- ${inputs.carryAwards.length} carry awards, total net (after LTCG tax): ${formatCompactCurrency(totalCarryNet)}
- Total GP commit obligations: ${formatCompactCurrency(totalGPCommit)}

SIMULATION RESULTS (${inputs.numSimulations} Monte Carlo paths):
- Success rate: ${formatPercentage(successRate, 1)}
- Ruin probability: ${formatPercentage(results.ruinProbability, 1)}
- Median terminal wealth at age ${inputs.planningAge}: ${formatCompactCurrency(results.medianTerminalWealth)}
- 10th percentile terminal wealth: ${formatCompactCurrency(results.percentilePaths[results.percentilePaths.length - 1]?.p10 ?? 0)}
- 90th percentile terminal wealth: ${formatCompactCurrency(results.percentilePaths[results.percentilePaths.length - 1]?.p90 ?? 0)}

Write the summary with these sections (use plain headers, no markdown bold or special characters):
1. Overall Assessment - one clear verdict sentence, then 2-3 sentences on the overall picture
2. Key Strengths - what this plan does well (2-3 specific points grounded in the numbers)
3. Primary Risks - the top 2-3 risks that could derail the plan, with specific numbers
4. What This Plan Is Most Sensitive To - the 2-3 inputs that most impact outcomes and why
5. Recommended Considerations - 2-3 specific, actionable steps worth discussing with an advisor

Use specific dollar amounts and percentages from the data. Be direct and professional. This is for a sophisticated PE professional, not a retail investor. Do not include disclaimers or generic advice.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: abortRef.current.signal,
      });

      const data = await response.json();
      const text = data.content
        ?.filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("") ?? "";

      if (!text) throw new Error("Empty response");
      setSummary(text);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Could not generate summary. Check your API connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  if (!results) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-muted)]">Run the simulation first to generate an executive summary.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Executive Summary</p>
          <h2 className="mt-1 text-base font-bold text-[var(--text-primary)]">
            Retirement Plan Analysis
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Age {inputs.currentAge} retiring at {inputs.retirementAge} — planning to {inputs.planningAge}
          </p>
        </div>
        <Badge
          label={successRate >= 0.85 ? "On Track" : successRate >= 0.7 ? "At Risk" : "Needs Attention"}
          color={verdictColor}
        />
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Success Rate", value: formatPercentage(successRate, 1), color: verdictColor },
          { label: "Ruin Probability", value: formatPercentage(results.ruinProbability, 1), color: results.ruinProbability > 0.2 ? "danger" : results.ruinProbability > 0.1 ? "warning" : "success" },
          { label: "Median Terminal", value: formatCompactCurrency(results.medianTerminalWealth), color: "neutral" },
          { label: "Net Carry", value: formatCompactCurrency(totalCarryNet), color: totalCarryNet > 0 ? "success" : "neutral" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
            <p className={`text-lg font-bold tabular-nums text-[var(--${m.color === "neutral" ? "text-primary" : m.color})]`}>{m.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Snapshot table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Plan Snapshot</p>
        <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
          <div>
            <MetricRow label="Years to retirement" value={`${yearsToRetirement} years`} />
            <MetricRow label="Investable assets today" value={formatCompactCurrency(investable)} />
            <MetricRow label="Combined gross income" value={`${formatCompactCurrency(combinedIncome)}/yr`} />
            <MetricRow label="Go-go spending target" value={`${formatCompactCurrency(inputs.spendingGoGo)}/yr`} sub="in today's dollars" />
            <MetricRow label="Expected CAGR" value={formatPercentage(inputs.expectedReturn, 1)} />
          </div>
          <div>
            <MetricRow label="Social Security age" value={`Age ${inputs.socialSecurityAge}`} />
            <MetricRow label="SS annual benefit" value={formatCompactCurrency(inputs.socialSecurityAmount)} sub="with 15% haircut applied" />
            <MetricRow label="Carry awards" value={`${inputs.carryAwards.length} awards`} sub={inputs.carryAwards.length > 0 ? `${formatCompactCurrency(totalCarryNet)} net` : "none"} />
            <MetricRow label="GP commit obligations" value={formatCompactCurrency(totalGPCommit)} />
            <MetricRow label="Mortgage remaining" value={`${formatCompactCurrency(inputs.mortgageBalance)}`} sub={`${inputs.mortgageYearsRemaining} years left`} />
          </div>
        </div>
      </div>

      {/* AI narrative */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            AI-Generated Narrative
          </p>
          <button
            onClick={generateSummary}
            disabled={loading}
            className="rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : summary ? "Regenerate" : "Generate Summary"}
          </button>
        </div>

        {!summary && !loading && !error && (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">
            Click Generate Summary to receive a personalized AI analysis of your plan including key risks, strengths, and what your outcomes are most sensitive to.
          </p>
        )}

        {loading && (
          <div className="grid gap-2 py-4">
            {[80, 60, 90, 50, 70].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-[var(--border)]" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-[var(--danger)] py-2">{error}</p>
        )}

        {summary && !loading && (
          <div className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
            {summary}
          </div>
        )}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        This summary is generated by AI based on your current inputs and simulation results. It is not financial advice. Consult a qualified financial advisor for personalized guidance.
      </p>
    </div>
  );
}