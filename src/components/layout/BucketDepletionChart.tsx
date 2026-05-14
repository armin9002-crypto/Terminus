import {
  Area, AreaChart, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from "recharts";
import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency } from "../../lib/formatters";
import { getInvestableAssets } from "../../engine/monteCarlo";

interface BucketYear {
  age: number;
  taxable: number;
  deferred: number;
  roth: number;
  total: number;
}

export function BucketDepletionChart() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);

  if (!results) return null;

  const SS_HAIRCUT = 0.85;
  const SS_FRA = 67;
  function getSsFactor(age: number): number {
    if (age <= 62) return 0.70;
    if (age >= 70) return 1.24;
    if (age < SS_FRA) { const e = SS_FRA - age; return e <= 3 ? 1 - e * 0.0667 : 1 - 3 * 0.0667 - (e-3)*0.05; }
    return 1 + (age - SS_FRA) * 0.08;
  }

  function getSpending(age: number): number {
    const idx = age - inputs.retirementAge;
    const inf = Math.pow(1 + inputs.inflationRate, idx);
    if (idx < inputs.goGoYears) return inputs.spendingGoGo * inf;
    if (idx < inputs.goGoYears + inputs.slowGoYears) return inputs.spendingSlowGo * inf;
    return (inputs.spendingNoGo + inputs.healthcareSurgeAmount) * inf;
  }

  function getNonPortfolioIncome(age: number): number {
    let ss = 0;
    if (age >= inputs.socialSecurityAge) {
      ss += inputs.socialSecurityAmount * getSsFactor(inputs.socialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.socialSecurityAge));
    }
    if (inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge) {
      ss += inputs.spouseSocialSecurityAmount * getSsFactor(inputs.spouseSocialSecurityAge) * SS_HAIRCUT * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.spouseSocialSecurityAge));
    }
    const other = inputs.otherRetirementIncome > 0 ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, age - inputs.retirementAge) : 0;
    return (ss + other) * 0.80; // rough after-tax
  }

  const data: BucketYear[] = [];

  let taxable = inputs.taxableAssets;
  let deferred = inputs.taxDeferredAssets;
  let roth = inputs.taxFreeAssets;
  const ret = inputs.expectedReturn;

  for (let age = inputs.currentAge; age <= inputs.planningAge; age++) {
    if (age < inputs.retirementAge) {
      const preTax = inputs.annualSalary * inputs.preTaxSavingsRate;
      const afterTax = (inputs.annualSalary * (1 - inputs.preTaxSavingsRate) * 0.65) * inputs.afterTaxSavingsRate;
      taxable = Math.max(0, taxable * (1 + ret) + afterTax);
      deferred = Math.max(0, deferred * (1 + ret) + preTax);
      roth = Math.max(0, roth * (1 + ret));
    } else {
      taxable = Math.max(0, taxable * (1 + ret));
      deferred = Math.max(0, deferred * (1 + ret));
      roth = Math.max(0, roth * (1 + ret));

      const spending = getSpending(age);
      const nonPortfolio = getNonPortfolioIncome(age);
      let needed = Math.max(0, spending - nonPortfolio);

      const fromTaxable = Math.min(taxable, needed);
      taxable -= fromTaxable;
      needed -= fromTaxable;

      if (needed > 0) {
        const fromDeferred = Math.min(deferred, needed);
        deferred -= fromDeferred;
        needed -= fromDeferred;
      }

      if (needed > 0) {
        roth = Math.max(0, roth - needed);
      }
    }

    data.push({
      age,
      taxable: Math.round(Math.max(0, taxable)),
      deferred: Math.round(Math.max(0, deferred)),
      roth: Math.round(Math.max(0, roth)),
      total: Math.round(Math.max(0, taxable + deferred + roth)),
    });
  }

  const taxableDepletesAt = data.find(d => d.taxable === 0 && d.age >= inputs.retirementAge)?.age;
  const deferredDepletesAt = data.find(d => d.deferred === 0 && d.age >= inputs.retirementAge)?.age;
  const rothDepletesAt = data.find(d => d.roth === 0 && d.age >= inputs.retirementAge)?.age;

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">Asset Bucket Projection</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Projected balance of each account type under a median-return deterministic model using
          sequential withdrawal: taxable first, then traditional IRA/401k, then Roth.
        </p>
      </div>

      <div className="h-[360px]">
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
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
            <Area type="monotone" dataKey="taxable" name="Taxable Brokerage" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.20} strokeWidth={2} />
            <Area type="monotone" dataKey="deferred" name="Traditional IRA/401k" stroke="#f97316" fill="#f97316" fillOpacity={0.20} strokeWidth={2} />
            <Area type="monotone" dataKey="roth" name="Roth IRA/401k" stroke="#22c55e" fill="#22c55e" fillOpacity={0.20} strokeWidth={2} />
            <ReferenceLine x={inputs.retirementAge} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: "Retire", fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }} />
            <ReferenceLine x={73} stroke="#8b5cf6" strokeDasharray="4 3" label={{ value: "RMDs", fill: "#8b5cf6", fontSize: 10, position: "insideTopLeft" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Taxable depletes", value: taxableDepletesAt ? `Age ${taxableDepletesAt}` : "Survives", color: "text-[var(--accent)]" },
          { label: "Traditional depletes", value: deferredDepletesAt ? `Age ${deferredDepletesAt}` : "Survives", color: "text-[var(--warning)]" },
          { label: "Roth depletes", value: rothDepletesAt ? `Age ${rothDepletesAt}` : "Survives", color: "text-[var(--success)]" },
        ].map(m => (
          <div key={m.label} className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-center">
            <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[var(--text-muted)]">
        This is a deterministic projection at the median expected return of {(inputs.expectedReturn * 100).toFixed(1)}%,
        not a Monte Carlo simulation. Actual bucket balances will vary significantly across scenarios.
        The sequential withdrawal order (taxable first) is a simplification -- optimal order depends
        on your specific tax situation and bracket management strategy.
      </p>
    </div>
  );
}