import {
  Area, AreaChart, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency } from "../../lib/formatters";
import { CARRY_DISTRIBUTION_CURVE } from "../../lib/constants";

interface TaxYear {
  age: number;
  ordinaryTax: number;
  ltcgTax: number;
  stateTax: number;
  totalTax: number;
  totalIncome: number;
  effectiveRate: number;
}

export function TaxDragTimelineChart() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);

  if (!results) return null;

  const SS_HAIRCUT = 0.85;
  const SS_FRA = 67;
  const LTCG_FED = 0.20;
  const NIIT = 0.038;
  const ORD_FED = 0.22;

  function getSsFactor(age: number): number {
    if (age <= 62) return 0.70;
    if (age >= 70) return 1.24;
    if (age < SS_FRA) {
      const e = SS_FRA - age;
      return e <= 3 ? 1 - e * 0.0667 : 1 - 3 * 0.0667 - (e - 3) * 0.05;
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

  const totalInvestable = inputs.taxableAssets + inputs.taxDeferredAssets + inputs.taxFreeAssets + inputs.cashReserves;
  const deferredFrac = totalInvestable > 0 ? inputs.taxDeferredAssets / totalInvestable : 0;
  const taxableFrac = totalInvestable > 0 ? inputs.taxableAssets / totalInvestable : 0;

  const data: TaxYear[] = [];

  for (let age = inputs.retirementAge; age <= inputs.planningAge; age++) {
    const calYear = inputs.simulationStartYear + (age - inputs.currentAge);
    const spending = getSpending(age);

    let ssGross = 0;
    if (age >= inputs.socialSecurityAge) {
      ssGross += inputs.socialSecurityAmount * getSsFactor(inputs.socialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.socialSecurityAge));
    }
    if (inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge) {
      ssGross += inputs.spouseSocialSecurityAmount * getSsFactor(inputs.spouseSocialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.spouseSocialSecurityAge));
    }

    let carryGross = 0;
    for (const award of inputs.carryAwards) {
      const fundYear = calYear - award.vintageYear + 1;
      if (fundYear >= 1 && fundYear <= 12) {
        const curvePct = CARRY_DISTRIBUTION_CURVE[fundYear - 1] ?? 0;
        if (curvePct > 0) {
          carryGross += award.totalPoolValue * award.poolValueCapture * award.vestedPercent * curvePct;
        }
      }
    }

    const otherGross = inputs.otherRetirementIncome > 0
      ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, age - inputs.retirementAge)
      : 0;

    const nonPortfolioGross = ssGross + otherGross;
    const portfolioDraw = Math.max(0, spending - nonPortfolioGross * 0.80 - carryGross * (1 - Math.min(LTCG_FED + NIIT + inputs.stateIncomeTaxRate, 0.55)));

    const ssTaxableIncome = ssGross * 0.85;
    const deferredDraw = portfolioDraw * deferredFrac;
    const taxableOrdinaryIncome = ssTaxableIncome + deferredDraw + otherGross;
    const ordinaryTax = taxableOrdinaryIncome * ORD_FED;

    const taxableDraw = portfolioDraw * taxableFrac;
    const ltcgTax = (taxableDraw + carryGross) * (LTCG_FED + NIIT);

    const stateTax = (taxableOrdinaryIncome + taxableDraw) * inputs.stateIncomeTaxRate;

    const totalTax = ordinaryTax + ltcgTax + stateTax;
    const totalIncome = ssGross + otherGross + carryGross + portfolioDraw;
    const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;

    data.push({ age, ordinaryTax, ltcgTax, stateTax, totalTax, totalIncome, effectiveRate });
  }

  const totalLifetimeTax = data.reduce((s, d) => s + d.totalTax, 0);
  const peakTaxYear = data.reduce((best, d) => d.totalTax > best.totalTax ? d : best, data[0]!);

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Estimated Retirement Tax Drag by Year</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Annual estimated taxes on retirement income: ordinary income (SS + deferred withdrawals),
          LTCG (taxable + carry), and state. Total lifetime retirement taxes:
          {" "}<span className="font-bold text-[var(--danger)]">{formatCompactCurrency(totalLifetimeTax)}</span>.
          Peak tax year at age {peakTaxYear?.age} ({formatCompactCurrency(peakTaxYear?.totalTax ?? 0)}).
        </p>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#2d3748" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2d3748" }} />
            <YAxis tickFormatter={formatCompactCurrency} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={72} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid #2d3748", borderRadius: 8, color: "#f1f5f9" }}
              formatter={(v: number, name: string) => [formatCompactCurrency(v), name]}
              labelFormatter={(age) => `Age ${age}`}
            />
            <Area type="monotone" dataKey="ordinaryTax" name="Federal Ordinary (SS + deferred)" stackId="a" stroke="none" fill="#f97316" fillOpacity={0.80} />
            <Area type="monotone" dataKey="ltcgTax" name="Federal LTCG (taxable + carry)" stackId="a" stroke="none" fill="#14b8a6" fillOpacity={0.80} />
            <Area type="monotone" dataKey="stateTax" name="State Income Tax" stackId="a" stroke="none" fill="#8b5cf6" fillOpacity={0.80} />
            <ReferenceLine x={73} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: "RMD Age 73", fill: "#f59e0b", fontSize: 10, position: "insideTopLeft" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-3 text-xs text-[var(--text-secondary)]">
        <span className="font-bold text-[var(--warning)]">RMD Note: </span>
        After age 73, Required Minimum Distributions from your {formatCompactCurrency(inputs.taxDeferredAssets)} traditional
        IRA/401k balance force taxable withdrawals regardless of spending needs. RMDs stacked with Social Security
        can push effective ordinary income tax rates to 24-32%, significantly above the 22% assumed here.
        This chart may understate tax drag in the post-73 years. A Roth conversion strategy in the
        gap between retirement and SS claiming ({inputs.retirementAge}-{inputs.socialSecurityAge}) could
        reduce this burden materially.
      </div>
    </div>
  );
}