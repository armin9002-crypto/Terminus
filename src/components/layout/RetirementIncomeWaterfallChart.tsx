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

function computeWaterfallData(inputs: SimInputs): WaterfallYear[] {
  const SS_FRA = 67;
  const SS_HAIRCUT = 0.85;
  const LTCG_RATE = Math.min(0.20 + 0.038 + inputs.stateIncomeTaxRate, 0.55);
  const ORD_RATE = 0.22 + inputs.stateIncomeTaxRate;

  function getSsFactor(age: number): number {
    if (age <= 62) return 0.70;
    if (age >= 70) return 1.24;
    if (age < SS_FRA) {
      const yearsEarly = SS_FRA - age;
      return yearsEarly <= 3 ? 1 - yearsEarly * 0.0667 : 1 - 3 * 0.0667 - (yearsEarly - 3) * 0.05;
    }
    return 1 + (age - SS_FRA) * 0.08;
  }

  function getSpending(age: number): number {
    const idx = age - inputs.retirementAge;
    const inf = Math.pow(1 + inputs.inflationRate, idx);
    if (idx < inputs.goGoYears) return inputs.spendingGoGo * inf;
    if (idx < inputs.goGoYears + inputs.slowGoYears) return inputs.spendingSlowGo * inf;
    return (inputs.spendingNoGo + inputs.healthcareSurgeAmount) * inf;
  }

  const result: WaterfallYear[] = [];

  for (let age = inputs.retirementAge; age <= inputs.planningAge; age++) {
    const calYear = inputs.simulationStartYear + (age - inputs.currentAge);
    const spending = getSpending(age);

    // SS income (gross, COLA-adjusted from claiming age)
    let ssGross = 0;
    if (age >= inputs.socialSecurityAge) {
      const factor = getSsFactor(inputs.socialSecurityAge);
      const yearsInflated = Math.max(0, age - inputs.socialSecurityAge);
      ssGross += inputs.socialSecurityAmount * factor * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, yearsInflated);
    }
    if (inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge) {
      const factor = getSsFactor(inputs.spouseSocialSecurityAge);
      const yearsInflated = Math.max(0, age - inputs.spouseSocialSecurityAge);
      ssGross += inputs.spouseSocialSecurityAmount * factor * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, yearsInflated);
    }
    // Apply rough SS tax (up to 85% taxable at ordinary rates)
    const ssAfterTax = ssGross * (1 - Math.min(0.85, 1) * ORD_RATE * 0.6);

    // Carry net income for this calendar year
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

    // Other retirement income (after rough tax)
    const otherGross = inputs.otherRetirementIncome > 0
      ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, age - inputs.retirementAge)
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
  const inputs = useSimStore((state) => state.inputs);
  const data = computeWaterfallData(inputs);

  // Decimate to every other year for readability if horizon > 25 years
  const horizon = inputs.planningAge - inputs.retirementAge;
  const displayData = horizon > 25 ? data.filter((_, i) => i % 2 === 0) : data;

  const portfolioDependent = data.map(d => d.portfolioDraw / Math.max(1, d.totalSpending));
  const firstMajorDrawYear = data.find(d => d.portfolioDraw / Math.max(1, d.totalSpending) > 0.5);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Retirement Income Sources</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          How your annual spending is covered year-by-year: SS, carry, other income, and portfolio draw.
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
            <Bar dataKey="ssIncome" name="Social Security (after tax)" stackId="a" fill="#38bdf8" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
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
          { label: "Total SS (lifetime)", value: formatCompactCurrency(data.reduce((s, d) => s + d.ssIncome, 0)), color: "#38bdf8" },
          { label: "Total Carry (lifetime)", value: formatCompactCurrency(data.reduce((s, d) => s + d.carryIncome, 0)), color: "#14b8a6" },
          { label: "Total Portfolio Draw", value: formatCompactCurrency(data.reduce((s, d) => s + d.portfolioDraw, 0)), color: "#f97316" },
          { label: "Portfolio Dependency", value: `${Math.round(data.reduce((s, d) => s + d.portfolioDraw, 0) / Math.max(1, data.reduce((s, d) => s + d.totalSpending, 0)) * 100)}% of spending`, color: "#94a3b8" },
        ].map((m) => (
          <div key={m.label} className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-center">
            <p className="text-sm font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}