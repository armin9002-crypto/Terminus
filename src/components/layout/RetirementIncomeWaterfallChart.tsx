import {
  Bar, CartesianGrid, ComposedChart, Legend, Line,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency } from "../../lib/formatters";
import { CARRY_DISTRIBUTION_CURVE } from "../../lib/constants";
import type { SimInputs } from "../../types";

interface WaterfallYear {
  age: number;
  ssIncome: number;
  carryIncome: number;
  otherIncome: number;
  portfolioDraw: number;
  totalSpending: number;
}

function getSsFactor(claimAge: number): number {
  const SS_FRA = 67;
  if (claimAge <= 62) return 0.70;
  if (claimAge >= 70) return 1.24;
  if (claimAge < SS_FRA) {
    const e = SS_FRA - claimAge;
    return e <= 3 ? 1 - e * 0.0667 : 1 - 3 * 0.0667 - (e - 3) * 0.05;
  }
  return 1 + (claimAge - SS_FRA) * 0.08;
}

function computeWaterfallData(inputs: SimInputs): WaterfallYear[] {
  const SS_HAIRCUT = 0.85;
  const LTCG_RATE = Math.min(0.20 + 0.038 + inputs.stateIncomeTaxRate, 0.55);
  const ORD_RATE = 0.22 + inputs.stateIncomeTaxRate;

  const result: WaterfallYear[] = [];

  for (let age = inputs.retirementAge; age <= inputs.planningAge; age++) {
    const calYear = inputs.simulationStartYear + (age - inputs.currentAge);
    const ri = age - inputs.retirementAge;
    const inf = Math.pow(1 + inputs.inflationRate, ri);
    let spending: number;
    if (ri < inputs.goGoYears) spending = inputs.spendingGoGo * inf;
    else if (ri < inputs.goGoYears + inputs.slowGoYears) spending = inputs.spendingSlowGo * inf;
    else spending = (inputs.spendingNoGo + inputs.healthcareSurgeAmount) * inf;

    let ssGross = 0;
    if (age >= inputs.socialSecurityAge) {
      const yInf = Math.max(0, age - inputs.socialSecurityAge);
      ssGross += inputs.socialSecurityAmount * getSsFactor(inputs.socialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, yInf);
    }
    if (inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge) {
      const yInf = Math.max(0, age - inputs.spouseSocialSecurityAge);
      ssGross += inputs.spouseSocialSecurityAmount * getSsFactor(inputs.spouseSocialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, yInf);
    }
    const ssAfterTax = ssGross * (1 - 0.85 * ORD_RATE * 0.6);

    let carryNet = 0;
    for (const award of inputs.carryAwards) {
      const fundYear = calYear - award.vintageYear + 1;
      if (fundYear >= 1 && fundYear <= 12) {
        const curvePct = CARRY_DISTRIBUTION_CURVE[fundYear - 1] ?? 0;
        if (curvePct > 0) {
          const gross = award.totalPoolValue * award.poolValueCapture * award.vestedPercent * curvePct;
          carryNet += gross * (1 - LTCG_RATE);
        }
      }
    }

    const otherGross = inputs.otherRetirementIncome > 0
      ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, ri)
      : 0;
    const otherAfterTax = otherGross * (1 - ORD_RATE);

    const nonPortfolio = ssAfterTax + carryNet + otherAfterTax;
    const portfolioDraw = Math.max(0, spending - nonPortfolio);

    result.push({
      age,
      ssIncome: Math.round(ssAfterTax),
      carryIncome: Math.round(carryNet),
      otherIncome: Math.round(otherAfterTax),
      portfolioDraw: Math.round(portfolioDraw),
      totalSpending: Math.round(spending),
    });
  }
  return result;
}

export function RetirementIncomeWaterfallChart() {
  const inputs = useSimStore((s) => s.inputs);
  const data = computeWaterfallData(inputs);

  const horizon = inputs.planningAge - inputs.retirementAge;
  const displayData = horizon > 25 ? data.filter((_, i) => i % 2 === 0) : data;
  const firstMajorDrawYear = data.find(d => d.portfolioDraw / Math.max(1, d.totalSpending) > 0.5);
  const totalSS = data.reduce((s, d) => s + d.ssIncome, 0);
  const totalCarry = data.reduce((s, d) => s + d.carryIncome, 0);
  const totalDraw = data.reduce((s, d) => s + d.portfolioDraw, 0);
  const totalSpend = data.reduce((s, d) => s + d.totalSpending, 0);
  const depPct = totalSpend > 0 ? Math.round(totalDraw / totalSpend * 100) : 0;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Retirement Income Sources</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          How annual spending is covered year-by-year. Stacked bars show SS (blue),
          carry distributions (teal), other income (green), and portfolio draw (orange).
          {firstMajorDrawYear && ` Portfolio becomes the majority income source at age ${firstMajorDrawYear.age}.`}
        </p>
      </div>

      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#2d3748" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2d3748" }} />
            <YAxis tickFormatter={formatCompactCurrency} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid #2d3748", borderRadius: 8, color: "#f1f5f9" }}
              formatter={(value: number, name: string) => [formatCompactCurrency(value), name]}
              labelFormatter={(age) => `Age ${age}`}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
            <Bar dataKey="ssIncome" name="Social Security (after tax)" stackId="a" fill="#38bdf8" fillOpacity={0.85} />
            <Bar dataKey="carryIncome" name="Carry Distributions (net)" stackId="a" fill="#14b8a6" fillOpacity={0.85} />
            <Bar dataKey="otherIncome" name="Other Income (after tax)" stackId="a" fill="#22c55e" fillOpacity={0.85} />
            <Bar dataKey="portfolioDraw" name="Portfolio Draw" stackId="a" fill="#f97316" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
            <Line dataKey="totalSpending" name="Total Spending" stroke="#f1f5f9" strokeWidth={1.5} dot={false} type="monotone" strokeDasharray="4 2" />
            <ReferenceLine x={inputs.socialSecurityAge} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: "SS", fill: "#38bdf8", fontSize: 10, position: "insideTopLeft" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total SS (lifetime)", value: formatCompactCurrency(totalSS), color: "#38bdf8" },
          { label: "Total Carry (lifetime)", value: formatCompactCurrency(totalCarry), color: "#14b8a6" },
          { label: "Total Portfolio Draw", value: formatCompactCurrency(totalDraw), color: "#f97316" },
          { label: "Portfolio Dependency", value: `${depPct}% of spending`, color: "#94a3b8" },
        ].map(m => (
          <div key={m.label} className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-center">
            <p className="text-sm font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}