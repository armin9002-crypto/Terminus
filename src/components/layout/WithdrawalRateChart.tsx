import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { useSimStore } from "../../store/useSimStore";
import { formatPercentage } from "../../lib/formatters";

interface WithdrawalRatePoint {
  age: number;
  rateP10: number;
  rateP50: number;
  rateP90: number;
  band: [number, number];
}

export function WithdrawalRateChart() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const isRunning = useSimStore((state) => state.isRunning);

  if (isRunning || !results) {
    return <div className="h-[360px] animate-pulse rounded-lg bg-[var(--border)]" />;
  }

  // Estimate annual non-portfolio income (SS + other, simplified)
  function estimateNonPortfolioIncome(age: number): number {
    const SS_HAIRCUT = 0.85;
    const SS_FRA = 67;
    function getSsFactor(a: number) {
      if (a <= 62) return 0.70;
      if (a >= 70) return 1.24;
      if (a < SS_FRA) { const e = SS_FRA - a; return e <= 3 ? 1 - e * 0.0667 : 1 - 3 * 0.0667 - (e - 3) * 0.05; }
      return 1 + (a - SS_FRA) * 0.08;
    }
    let ss = 0;
    if (age >= inputs.socialSecurityAge) {
      ss += inputs.socialSecurityAmount * getSsFactor(inputs.socialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.socialSecurityAge));
    }
    if (inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge) {
      ss += inputs.spouseSocialSecurityAmount * getSsFactor(inputs.spouseSocialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.spouseSocialSecurityAge));
    }
    const other = inputs.otherRetirementIncome > 0
      ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, age - inputs.retirementAge)
      : 0;
    return ss + other;
  }

  const data: WithdrawalRatePoint[] = results.percentilePaths
    .filter(p => p.age >= inputs.retirementAge)
    .map((p, i) => {
      const spending = results.yearlyMedianSpend[inputs.retirementAge - inputs.currentAge + i] ?? 0;
      const nonPortfolio = estimateNonPortfolioIncome(p.age);
      const netDraw = Math.max(0, spending - nonPortfolio);
      const rateP10 = p.p10 > 0 ? (netDraw / p.p10) : 0;
      const rateP50 = p.p50 > 0 ? (netDraw / p.p50) : 0;
      const rateP90 = p.p90 > 0 ? (netDraw / p.p90) : 0;
      return {
        age: p.age,
        rateP10: Math.min(rateP10, 0.30),
        rateP50: Math.min(rateP50, 0.30),
        rateP90: Math.min(rateP90, 0.30),
        band: [Math.min(rateP90, 0.30), Math.min(rateP10, 0.30)] as [number, number],
      };
    });

  const firstDangerAge = data.find(d => d.rateP50 > 0.05)?.age;
  const firstUnsafeAge = data.find(d => d.rateP10 > 0.08)?.age;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Portfolio Withdrawal Rate Over Time</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Net portfolio draw as a percentage of portfolio value at each age.
          Below 4% is considered safe; above 6-8% in bad scenarios is a warning sign.
          {firstDangerAge && ` Median rate exceeds 5% starting around age ${firstDangerAge}.`}
        </p>
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#2d3748" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2d3748" }} />
            <YAxis
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false} axisLine={false} width={48}
              domain={[0, 0.20]}
            />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid #2d3748", borderRadius: 8, color: "#f1f5f9" }}
              formatter={(value: number, name: string) => [`${(value * 100).toFixed(1)}%`, name]}
              labelFormatter={(age) => `Age ${age}`}
            />
            <Area type="monotone" dataKey="band" name="10th-90th pct range" stroke="none" fill="#14b8a6" fillOpacity={0.10} activeDot={false} />
            <ReferenceLine y={0.04} stroke="#22c55e" strokeDasharray="5 3" label={{ value: "4% safe rate", fill: "#22c55e", fontSize: 10, position: "insideTopRight" }} />
            <ReferenceLine y={0.06} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: "6% caution", fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }} />
            <ReferenceLine y={0.08} stroke="#ef4444" strokeDasharray="5 3" label={{ value: "8% danger", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }} />
            <Line dataKey="rateP10" name="10th pct (bad scenario)" stroke="#ef4444" strokeWidth={1.5} dot={false} type="monotone" />
            <Line dataKey="rateP50" name="Median" stroke="#e2fffb" strokeWidth={2} dot={false} type="monotone" />
            <Line dataKey="rateP90" name="90th pct (good scenario)" stroke="#22c55e" strokeWidth={1.5} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">How to read this:</strong> In a good scenario (green, 90th percentile wealth), your large portfolio means a small withdrawal rate even on significant spending. In a bad scenario (red, 10th percentile), a depleted portfolio requires a high withdrawal rate to maintain spending -- eventually unsustainable. When the red line exceeds 8%, those paths are approaching ruin. The 4% green reference line represents the conventional "safe withdrawal rate" from financial planning research.
      </div>
    </div>
  );
}