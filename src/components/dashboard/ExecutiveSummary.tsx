import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useSimStore } from "../../store/useSimStore";
import { runSimulation, getInvestableAssets, getAccumulationSummary, solveSustainableSpend } from "../../engine/monteCarlo";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: "success" | "warning" | "danger" | "accent" }) {
  const colorClass = color === "success" ? "text-[var(--success)]"
    : color === "warning" ? "text-[var(--warning)]"
    : color === "danger" ? "text-[var(--danger)]"
    : color === "accent" ? "text-[var(--accent)]"
    : "text-[var(--text-primary)]";
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
      <p className={`text-xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--accent)] mt-0.5">{sub}</p>}
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1 mb-1.5">
      {children}
    </p>
  );
}

function Row({ label, value, indent }: { label: string; value: string; indent?: boolean }) {
  return (
    <div className={`flex justify-between items-baseline py-1 border-b border-[var(--border)] last:border-0 ${indent ? "pl-4" : ""}`}>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{value}</span>
    </div>
  );
}

function NarrativeSection({ title, children, tone }: { title: string; children: string; tone?: "success" | "warning" | "danger" | "neutral" }) {
  const barColor = tone === "success" ? "bg-[var(--success)]"
    : tone === "warning" ? "bg-[var(--warning)]"
    : tone === "danger" ? "bg-[var(--danger)]"
    : "bg-[var(--accent)]";
  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-1 rounded-full ${barColor}`} />
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)] pl-3">{children}</p>
    </div>
  );
}

interface ComparativeResults {
  noCarry: number;
  retireEarlier: number;
  retireLater: number;
  sustainableSpend: number;
  highSpend: number;
  lowSpend: number;
}

export function ExecutiveSummary() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const [comparative, setComparative] = useState<ComparativeResults | null>(null);
  const [loading, setLoading] = useState(false);

  const successRate = results?.successRate ?? 0;
  const ruin = results?.ruinProbability ?? 0;
  const medianTerminal = results?.medianTerminalWealth ?? 0;
  const investable = getInvestableAssets(inputs);
  const summary = results ? getAccumulationSummary(inputs) : null;

  const totalCarryNet = inputs.carryAwards.reduce((sum, a) => {
    const gross = a.totalPoolValue * a.poolValueCapture * a.vestedPercent;
    const taxRate = Math.min(0.20 + 0.038 + inputs.stateIncomeTaxRate, 0.55);
    return sum + gross * (1 - taxRate);
  }, 0);

  const totalGPCommit = inputs.carryAwards.reduce(
    (sum, a) => sum + a.totalPoolValue * a.gpCommitPercent, 0
  );

  const combinedIncome = inputs.annualSalary + (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
  const p10Terminal = results?.percentilePaths[results.percentilePaths.length - 1]?.p10 ?? 0;
  const p90Terminal = results?.percentilePaths[results.percentilePaths.length - 1]?.p90 ?? 0;

  useEffect(() => {
    if (!results) return;
    setLoading(true);
    const n = Math.min(inputs.numSimulations, 250);
    setTimeout(() => {
      const noCarryRate = runSimulation({ ...inputs, carryAwards: [], numSimulations: n }).successRate;
      const earlierRate = runSimulation({ ...inputs, retirementAge: Math.max(inputs.currentAge + 1, inputs.retirementAge - 3), numSimulations: n }).successRate;
      const laterRate = runSimulation({ ...inputs, retirementAge: Math.min(inputs.planningAge - 1, inputs.retirementAge + 3), numSimulations: n }).successRate;
      const sustainSpend = solveSustainableSpend(inputs);
      const highSpendRate = runSimulation({ ...inputs, spendingGoGo: inputs.spendingGoGo * 1.2, spendingSlowGo: inputs.spendingSlowGo * 1.2, spendingNoGo: inputs.spendingNoGo * 1.2, numSimulations: n }).successRate;
      const lowSpendRate = runSimulation({ ...inputs, spendingGoGo: inputs.spendingGoGo * 0.8, spendingSlowGo: inputs.spendingSlowGo * 0.8, spendingNoGo: inputs.spendingNoGo * 0.8, numSimulations: n }).successRate;
      setComparative({
        noCarry: noCarryRate,
        retireEarlier: earlierRate,
        retireLater: laterRate,
        sustainableSpend: sustainSpend,
        highSpend: highSpendRate,
        lowSpend: lowSpendRate,
      });
      setLoading(false);
    }, 0);
  }, [results?.successRate, inputs.retirementAge, inputs.spendingGoGo]);

  if (!results) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[var(--text-muted)]">Simulation not yet run.</p>
      </div>
    );
  }

  const verdictColor: "success" | "warning" | "danger" = successRate >= 0.85 ? "success" : successRate >= 0.70 ? "warning" : "danger";

  const carryLift = comparative ? successRate - comparative.noCarry : null;
  const workingLift = comparative ? comparative.retireLater - successRate : null;
  const earlyPenalty = comparative ? successRate - comparative.retireEarlier : null;
  const spendUpPenalty = comparative ? successRate - comparative.highSpend : null;
  const spendDownGain = comparative ? comparative.lowSpend - successRate : null;

  function overallVerdict(): string {
    const retYears = inputs.retirementAge - inputs.currentAge;
    const estAtRetirement = formatCompactCurrency(summary?.estimatedRetirementAssets ?? 0);
    const ssDelay = inputs.socialSecurityAge - inputs.retirementAge;

    if (successRate >= 0.90) {
      return `This plan is strongly positioned. Across ${inputs.numSimulations.toLocaleString()} simulated futures, ${formatPercentage(successRate)} succeed through age ${inputs.planningAge} -- well above the 85% planning threshold. With ${formatCompactCurrency(investable)} investable today and ${retYears} years of additional compounding, projected assets at retirement of approximately ${estAtRetirement} provide a substantial margin of safety. Social Security claims at age ${inputs.socialSecurityAge}${ssDelay > 0 ? `, delayed ${ssDelay} years past retirement for maximum benefit` : ""} . The primary question is not whether the plan succeeds but how much wealth accumulates beyond what is needed.`;
    }
    if (successRate >= 0.80) {
      return `This plan is on track with a ${formatPercentage(successRate)} success rate across ${inputs.numSimulations.toLocaleString()} simulated futures -- above the 85% planning threshold${successRate >= 0.85 ? "" : " though modestly below it"}. Projected assets of approximately ${estAtRetirement} at retirement provide a reasonable base. Several risk factors merit monitoring: the width of the outcome distribution is significant, with the 10th percentile terminal balance of ${formatCompactCurrency(p10Terminal)} representing a substantial shortfall from the median of ${formatCompactCurrency(medianTerminal)}.`;
    }
    return `This plan carries meaningful retirement risk. Only ${formatPercentage(successRate)} of simulated paths succeed through age ${inputs.planningAge}, below the conventional 85% planning threshold. The ${formatPercentage(ruin)} ruin probability means roughly 1 in ${Math.round(1 / ruin)} scenarios leads to portfolio depletion during retirement. In adverse scenarios (10th percentile), the terminal balance is ${formatCompactCurrency(p10Terminal)}, compared to a median of ${formatCompactCurrency(medianTerminal)}. The plan as currently structured requires either higher savings, lower spending, delayed retirement, or a combination of all three.`;
  }

  function accumulationSection(): string {
    if (!summary) return "";
    const retYears = inputs.retirementAge - inputs.currentAge;
    const savingsRate = combinedIncome > 0 ? (summary.annualSavings / combinedIncome) * 100 : 0;
    return `${retYears} years separate today from retirement at ${inputs.retirementAge}. At a combined gross income of ${formatCompactCurrency(combinedIncome)}/year and total savings rate of ${savingsRate.toFixed(0)}% (${formatCompactCurrency(summary.preTaxSavings)}/yr pre-tax + ${formatCompactCurrency(summary.afterTaxSavings)}/yr after-tax), projected investable assets at retirement are approximately ${formatCompactCurrency(summary.estimatedRetirementAssets)}, based on ${formatPercentage(inputs.expectedReturn, 1)} CAGR with ${formatPercentage(inputs.volatility, 0)} volatility. The asset mix today is ${formatPercentage(inputs.taxDeferredAssets / Math.max(1, investable), 0)} tax-deferred, ${formatPercentage(inputs.taxableAssets / Math.max(1, investable), 0)} taxable, and ${formatPercentage(inputs.taxFreeAssets / Math.max(1, investable), 0)} Roth. ${inputs.mortgageBalance > 0 ? `The ${formatCompactCurrency(inputs.mortgageBalance)} mortgage with ${inputs.mortgageYearsRemaining} years remaining reduces spendable income by ${formatCompactCurrency(inputs.mortgageAnnualPayment)}/year until payoff.` : "The portfolio carries no mortgage obligation."}`;
  }

  function spendingSection(): string {
    const sustainMonthly = comparative ? formatCompactCurrency(comparative.sustainableSpend) : "--";
    const sustainAnnual = comparative ? formatCompactCurrency(comparative.sustainableSpend * 12) : "--";
    const targetVsSustain = comparative ? inputs.spendingGoGo - comparative.sustainableSpend * 12 : 0;
    const rel = targetVsSustain > 0 ? `${formatCompactCurrency(targetVsSustain)}/year above` : `${formatCompactCurrency(Math.abs(targetVsSustain))}/year below`;
    return `The 85%-confidence sustainable spend is ${sustainAnnual}/year (${sustainMonthly}/month), with current go-go spending of ${formatCompactCurrency(inputs.spendingGoGo)}/year sitting ${rel} that threshold. ${inputs.spendingGoGo > 0 && comparative ? `A 20% spending increase to ${formatCompactCurrency(inputs.spendingGoGo * 1.2)}/year reduces the success rate by ${formatPercentage(spendUpPenalty ?? 0, 1)} to ${formatPercentage(comparative.highSpend, 0)}. A 20% reduction to ${formatCompactCurrency(inputs.spendingGoGo * 0.8)}/year improves it by ${formatPercentage(spendDownGain ?? 0, 1)} to ${formatPercentage(comparative.lowSpend, 0)}.` : ""} At ${formatPercentage(inputs.inflationRate, 1)} inflation, the go-go spending target of ${formatCompactCurrency(inputs.spendingGoGo)} in today's dollars requires ${formatCompactCurrency(inputs.spendingGoGo * Math.pow(1 + inputs.inflationRate, inputs.retirementAge - inputs.currentAge))}/year in nominal terms at retirement.`;
  }

  function carrySection(): string {
    if (inputs.carryAwards.length === 0) {
      return "No carry awards are modeled. For PE professionals with meaningful carry, this is often the largest single lever in the retirement plan. Even modest carry materializing meaningfully changes the outcome distribution.";
    }
    const carryLiftStr = carryLift !== null ? formatPercentage(Math.abs(carryLift), 1) : "--";
    const netCarryVsSpending = totalCarryNet > 0 ? (totalCarryNet / (inputs.spendingGoGo * (inputs.goGoYears + inputs.slowGoYears))).toFixed(1) : "0";
    const firstAwardVintage = Math.min(...inputs.carryAwards.map(a => a.vintageYear));
    const lastAwardPeak = Math.max(...inputs.carryAwards.map(a => a.vintageYear + 8));
    return `${inputs.carryAwards.length} carry award${inputs.carryAwards.length > 1 ? "s" : ""} contribute ${formatCompactCurrency(totalCarryNet)} in net after-tax distributions, offset by ${formatCompactCurrency(totalGPCommit)} in GP commit obligations. Peak distributions are projected ${firstAwardVintage + 6}-${lastAwardPeak}. ${carryLift !== null ? `Removing carry entirely reduces the success rate by ${carryLiftStr} to ${formatPercentage(comparative!.noCarry, 0)}, making carry responsible for approximately ${carryLiftStr} of the plan's current confidence margin.` : ""} Net carry of ${formatCompactCurrency(totalCarryNet)} represents approximately ${netCarryVsSpending}x the combined go-go and slow-go spending budget, providing a meaningful cushion if distributions materialize as modeled. The primary carry risk is capture rate uncertainty -- the Pool Value Capture inputs reflect your conservatism discount, but actual exits depend heavily on exit environment and fund performance.`;
  }

  function retirementTimingSection(): string {
    if (!comparative) return "Run analysis to compute retirement timing sensitivity.";
    const laterStr = `Working ${3} additional years to age ${Math.min(inputs.planningAge - 1, inputs.retirementAge + 3)} improves the success rate by ${formatPercentage(Math.abs(workingLift ?? 0), 1)} to ${formatPercentage(comparative.retireLater, 0)}.`;
    const earlierStr = `Retiring ${3} years earlier at age ${Math.max(inputs.currentAge + 1, inputs.retirementAge - 3)} reduces the success rate by ${formatPercentage(Math.abs(earlyPenalty ?? 0), 1)} to ${formatPercentage(comparative.retireEarlier, 0)}.`;
    const ssStr = `Social Security is claimed at ${inputs.socialSecurityAge}. ${inputs.socialSecurityAge < 67 ? `Delaying to the Full Retirement Age of 67 would increase your benefit by approximately ${formatPercentage((67 - inputs.socialSecurityAge) * 0.0667, 0)}, adding roughly ${formatCompactCurrency((67 - inputs.socialSecurityAge) * 0.0667 * inputs.socialSecurityAmount)}/year to retirement income.` : inputs.socialSecurityAge === 67 ? `Claiming at FRA maximizes the balance between lifetime total and monthly benefit.` : `Claiming past FRA captures delayed credits of 8%/year, maximizing the monthly benefit.`}`;
    return `${laterStr} ${earlierStr} ${ssStr} Each additional working year simultaneously adds to the asset base, reduces the retirement horizon by one year, and defers the onset of portfolio withdrawals.`;
  }

  function riskSection(): string {
    const p10AtRetire = results?.percentilePaths.find(p => p.age === inputs.retirementAge)?.p10 ?? 0;
    const p50AtRetire = results?.percentilePaths.find(p => p.age === inputs.retirementAge)?.p50 ?? 0;
    const sequenceStr = p50AtRetire > 0 && p10AtRetire / p50AtRetire < 0.75
      ? `In the worst-decile paths at retirement, the portfolio is already at ${formatPercentage(p10AtRetire / p50AtRetire, 0)} of the median -- sequence-of-returns risk is material. A 2-3 year cash reserve at retirement would allow the portfolio time to recover from an early drawdown without forcing sales at depressed prices.`
      : "The spread between 10th and 50th percentile wealth at retirement is within a manageable range, suggesting moderate sequence-of-returns exposure.";
    const taxStr = inputs.taxDeferredAssets > 1_000_000
      ? `The ${formatCompactCurrency(inputs.taxDeferredAssets)} tax-deferred balance will generate substantial RMDs after age 73. RMDs stacked with Social Security can push distributions into the 24-32% bracket -- materially above the 22% assumed in this model. A Roth conversion strategy in the window between retirement and SS claiming could reduce this burden.`
      : "Tax-deferred balances are manageable relative to expected retirement income, limiting near-term RMD exposure.";
    return `${sequenceStr} ${taxStr} Inflation is modeled at ${formatPercentage(inputs.inflationRate, 1)} -- a persistent overshoot to 4% would erode purchasing power by an additional ${formatPercentage(Math.pow(1.04 / (1 + inputs.inflationRate), inputs.planningAge - inputs.retirementAge) - 1, 0)} over the retirement horizon.`;
  }

  function sensitivitySection(): string {
    if (!comparative) return "Computing sensitivity...";
    const findings: string[] = [];
    if (spendUpPenalty !== null && Math.abs(spendUpPenalty) > 0.03)
      findings.push(`spending (a 20% increase costs ${formatPercentage(Math.abs(spendUpPenalty), 1)} in success rate)`);
    if (carryLift !== null && Math.abs(carryLift) > 0.04)
      findings.push(`carry realization (removing carry entirely costs ${formatPercentage(Math.abs(carryLift), 1)})`);
    if (workingLift !== null && Math.abs(workingLift) > 0.03)
      findings.push(`retirement timing (3 additional years gains ${formatPercentage(Math.abs(workingLift), 1)})`);
    if (findings.length === 0)
      findings.push("spending level", "market return assumptions", "retirement age");
    return `The plan is most sensitive to: ${findings.join(", ")}. The single largest controllable lever is spending -- every dollar reduction in annual retirement spending directly extends the portfolio's runway. Market return assumptions (currently ${formatPercentage(inputs.expectedReturn, 1)} CAGR) drive the widening outcome distribution: at ${formatPercentage(inputs.volatility, 0)} volatility, the 10th-to-90th percentile range at age ${inputs.planningAge} spans ${formatCompactCurrency(p90Terminal - p10Terminal)}, illustrating how wide the range of possible futures is even with median inputs.`;
  }

  const narrativeSections = [
    { title: "Overall Assessment", content: overallVerdict(), tone: verdictColor },
    { title: "Accumulation Phase", content: accumulationSection(), tone: "neutral" as const },
    { title: "Spending Plan", content: spendingSection(), tone: (inputs.spendingGoGo > (comparative?.sustainableSpend ?? 0) * 12 ? "warning" : "success") as "success" | "warning" | "danger" | "neutral" },
    { title: "PE Carry Analysis", content: carrySection(), tone: inputs.carryAwards.length > 0 ? "success" as const : "neutral" as const },
    { title: "Retirement Timing", content: retirementTimingSection(), tone: "neutral" as const },
    { title: "Key Risks", content: riskSection(), tone: successRate < 0.85 ? "danger" as const : "warning" as const },
    { title: "Sensitivity", content: sensitivitySection(), tone: "neutral" as const },
  ];

  return (
    <div className="grid gap-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Executive Summary</p>
          <h2 className="mt-1 text-sm font-bold text-[var(--text-primary)]">
            Retirement Plan Analysis -- Age {inputs.currentAge} retiring at {inputs.retirementAge}
          </h2>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
          verdictColor === "success" ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
          : verdictColor === "warning" ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"
          : "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"
        }`}>
          {successRate >= 0.85 ? "On Track" : successRate >= 0.70 ? "At Risk" : "Needs Attention"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Success Rate" value={formatPercentage(successRate, 1)} color={verdictColor} />
        <Metric label="Ruin Probability" value={formatPercentage(ruin, 1)} color={ruin > 0.2 ? "danger" : ruin > 0.1 ? "warning" : "success"} />
        <Metric label="Median Terminal" value={formatCompactCurrency(medianTerminal)} />
        <Metric label="Safe Monthly Spend" value={comparative ? formatCompactCurrency(comparative.sustainableSpend) : "--"} sub="at 85% confidence" color="accent" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="10th Pct Terminal" value={formatCompactCurrency(p10Terminal)} color={p10Terminal < 0 ? "danger" : undefined} />
        <Metric label="90th Pct Terminal" value={formatCompactCurrency(p90Terminal)} />
        <Metric label="Net Carry (after tax)" value={formatCompactCurrency(totalCarryNet)} color={totalCarryNet > 0 ? "success" : undefined} />
        <Metric label="GP Commit Total" value={formatCompactCurrency(totalGPCommit)} color={totalGPCommit > 0 ? "danger" : undefined} />
      </div>

      {comparative && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 grid gap-2">
          <SectionHeader>Scenario Comparisons (250-path quick run)</SectionHeader>
          <Row label="Base case success rate" value={formatPercentage(successRate, 1)} />
          <Row label={`Retire ${3} years earlier (age ${Math.max(inputs.currentAge + 1, inputs.retirementAge - 3)})`} value={formatPercentage(comparative.retireEarlier, 1)} indent />
          <Row label={`Retire ${3} years later (age ${Math.min(inputs.planningAge - 1, inputs.retirementAge + 3)})`} value={formatPercentage(comparative.retireLater, 1)} indent />
          <Row label="Remove all carry awards" value={formatPercentage(comparative.noCarry, 1)} indent />
          <Row label="Spend 20% more" value={formatPercentage(comparative.highSpend, 1)} indent />
          <Row label="Spend 20% less" value={formatPercentage(comparative.lowSpend, 1)} indent />
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-xs text-[var(--text-muted)] text-center">Computing comparative scenarios...</p>
          <div className="mt-3 grid gap-2">
            {[75, 55, 85, 60].map((w, i) => <div key={i} className="h-2.5 animate-pulse rounded bg-[var(--border)]" style={{ width: `${w}%` }} />)}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <SectionHeader>Plan Snapshot</SectionHeader>
        <div className="grid sm:grid-cols-2 gap-x-8">
          <div>
            <Row label="Years to retirement" value={`${inputs.retirementAge - inputs.currentAge} years`} />
            <Row label="Investable assets today" value={formatCompactCurrency(investable)} />
            <Row label="Combined gross income" value={`${formatCompactCurrency(combinedIncome)}/yr`} />
            <Row label="Go-go spending target" value={`${formatCompactCurrency(inputs.spendingGoGo)}/yr`} />
            <Row label="Expected CAGR" value={formatPercentage(inputs.expectedReturn, 1)} />
            <Row label="Volatility" value={formatPercentage(inputs.volatility, 0)} />
          </div>
          <div>
            <Row label="SS claiming age" value={`Age ${inputs.socialSecurityAge}`} />
            <Row label="SS annual benefit" value={`${formatCompactCurrency(inputs.socialSecurityAmount)}/yr (w/ 15% haircut)`} />
            {inputs.hasSpouse && <Row label="Spouse SS benefit" value={`${formatCompactCurrency(inputs.spouseSocialSecurityAmount)}/yr at ${inputs.spouseSocialSecurityAge}`} />}
            <Row label="Carry awards" value={`${inputs.carryAwards.length} awards | ${formatCompactCurrency(totalCarryNet)} net`} />
            <Row label="GP commit obligations" value={formatCompactCurrency(totalGPCommit)} />
            <Row label="Mortgage" value={inputs.mortgageBalance > 0 ? `${formatCompactCurrency(inputs.mortgageBalance)} | ${inputs.mortgageYearsRemaining} yrs` : "None"} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 grid gap-5">
        <SectionHeader>Narrative Analysis</SectionHeader>
        {narrativeSections.map((s) => (
          <NarrativeSection key={s.title} title={s.title} tone={s.tone}>{s.content}</NarrativeSection>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Comparative scenarios use 250 simulation paths for speed and may vary slightly from the main simulation.
        This analysis is generated from your current inputs and is not financial advice.
      </p>
    </div>
  );
}