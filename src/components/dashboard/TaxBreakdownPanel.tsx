import { useSimStore } from "../../store/useSimStore";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { getAccumulationSummary } from "../../engine/monteCarlo";

interface TaxBracket {
  rate: string;
  income: string;
  tax: string;
  filled: number; // 0-100, how much of this bracket is used
}

function computeBracketBreakdown(
  agi: number, 
  isMFJ: boolean
): TaxBracket[] {
  const brackets = isMFJ ? [
    { rate: '10%', min: 0,      max: 23200,  tax: 0 },
    { rate: '12%', min: 23200,  max: 94300,  tax: 2320 },
    { rate: '22%', min: 94300,  max: 201050, tax: 10838 },
    { rate: '24%', min: 201050, max: 383900, tax: 34337 },
    { rate: '32%', min: 383900, max: 487450, tax: 78221 },
    { rate: '35%', min: 487450, max: 731200, tax: 111357 },
    { rate: '37%', min: 731200, max: Infinity, tax: 196669 },
  ] : [
    { rate: '10%', min: 0,      max: 11600,  tax: 0 },
    { rate: '12%', min: 11600,  max: 47150,  tax: 1160 },
    { rate: '22%', min: 47150,  max: 100525, tax: 5426 },
    { rate: '24%', min: 100525, max: 191950, tax: 17168 },
    { rate: '32%', min: 191950, max: 243725, tax: 39110 },
    { rate: '35%', min: 243725, max: 609350, tax: 55678 },
    { rate: '37%', min: 609350, max: Infinity, tax: 183647 },
  ];

  return brackets.map(bracket => {
    if (agi <= bracket.min) {
      return { 
        rate: bracket.rate, 
        income: '$0', 
        tax: '$0', 
        filled: 0 
      };
    }
    const incomeInBracket = Math.max(0, 
      Math.min(agi, bracket.max === Infinity ? agi : bracket.max) 
      - bracket.min
    );
    const rateNum = parseFloat(bracket.rate) / 100;
    const taxInBracket = incomeInBracket * rateNum;
    const bracketSize = bracket.max === Infinity 
      ? incomeInBracket 
      : bracket.max - bracket.min;
    const filled = Math.min(100, (incomeInBracket / bracketSize) * 100);
    
    return {
      rate: bracket.rate,
      income: formatCompactCurrency(incomeInBracket),
      tax: formatCompactCurrency(taxInBracket),
      filled: Math.round(filled),
    };
  });
}

export function TaxBreakdownPanel() {
  const inputs = useSimStore(state => state.inputs);
  
  const isMFJ = inputs.filingStatus === 'mfj';
  const combinedGross = inputs.annualSalary + 
    (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
  
  // Pre-tax deductions
  const preTaxDeductions = combinedGross * inputs.preTaxSavingsRate;
  const stdDeduction = isMFJ ? 29200 : 14600;
  const taxableIncome = Math.max(0, combinedGross - preTaxDeductions);
  const agi = Math.max(0, taxableIncome - stdDeduction);
  
  // Federal tax calculation
  const brackets = computeBracketBreakdown(agi, isMFJ);
  const totalFedTax = brackets.reduce((sum, b) => {
    const taxNum = parseFloat(b.tax.replace(/[$,KM]/g, '')) * 
      (b.tax.includes('M') ? 1000000 : b.tax.includes('K') ? 1000 : 1);
    return sum + taxNum;
  }, 0);
  
  // Child tax credit
  const childTaxCredit = Math.min(inputs.numDependents, 3) * 2000;
  const creditPhaseOut = isMFJ 
    ? Math.max(0, (agi - 400000) / 1000) * 50 
    : Math.max(0, (agi - 200000) / 1000) * 50;
  const effectiveChildCredit = Math.max(0, childTaxCredit - creditPhaseOut);
  const fedTaxAfterCredit = Math.max(0, totalFedTax - effectiveChildCredit);
  
  // FICA
  const ficaSS = Math.min(combinedGross, 168600) * 0.062;
  const ficaMedicare = combinedGross * 0.0145;
  const addlMedicareThreshold = isMFJ ? 250000 : 200000;
  const addlMedicare = Math.max(0, combinedGross - addlMedicareThreshold) * 0.009;
  const totalFICA = ficaSS + ficaMedicare + addlMedicare;
  
  // State tax
  const stateTax = taxableIncome * inputs.stateIncomeTaxRate;
  
  const totalTax = fedTaxAfterCredit + totalFICA + stateTax;
  const effectiveRate = combinedGross > 0 ? totalTax / combinedGross : 0;
  const marginalRate = agi > 731200 ? 0.37 : agi > 487450 ? 0.35 :
    agi > 383900 ? 0.32 : agi > 201050 ? 0.24 : agi > 94300 ? 0.22 :
    agi > 23200 ? 0.12 : 0.10;
  const afterTax = Math.max(0, combinedGross - totalTax);
  const saved = preTaxDeductions + afterTax * inputs.afterTaxSavingsRate;
  const spendable = afterTax * (1 - inputs.afterTaxSavingsRate);

  // Row component for clarity
  const Row = ({ 
    label, value, indent = false, bold = false, 
    color = 'neutral', border = false 
  }: { 
    label: string; value: string; indent?: boolean; 
    bold?: boolean; color?: string; border?: boolean 
  }) => (
    <div className={`flex justify-between items-center py-1 
      ${border ? 'border-t border-[var(--border)] mt-1 pt-2' : ''}
      ${indent ? 'pl-4' : ''}
    `}>
      <span className={`text-xs ${bold 
        ? 'font-bold text-[var(--text-primary)]' 
        : 'text-[var(--text-muted)]'}`}>
        {label}
      </span>
      <span className={`text-xs font-bold tabular-nums ${
        color === 'danger' ? 'text-[var(--danger)]' :
        color === 'success' ? 'text-[var(--success)]' :
        color === 'accent' ? 'text-[var(--accent)]' :
        'text-[var(--text-primary)]'
      }`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="grid gap-4">
      
      {/* Income Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: 'Gross Income', value: formatCompactCurrency(combinedGross), color: 'neutral' },
          { label: 'Total Tax Burden', value: formatCompactCurrency(totalTax), color: 'danger' },
          { label: 'Effective Tax Rate', value: formatPercentage(effectiveRate, 1), color: 'danger' },
          { label: 'Annual Take-Home', value: formatCompactCurrency(afterTax), color: 'success' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border border-[var(--border)] 
            bg-[var(--bg-card)] p-3 text-center">
            <p className={`text-xl font-bold tabular-nums ${
              stat.color === 'danger' ? 'text-[var(--danger)]' :
              stat.color === 'success' ? 'text-[var(--success)]' :
              'text-[var(--text-primary)]'
            }`}>{stat.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] 
              uppercase tracking-widest mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid gap-4 md:grid-cols-2">
        
        {/* Left: Income waterfall */}
        <div className="rounded-lg border border-[var(--border)] 
          bg-[var(--bg-card)] p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest 
            text-[var(--text-muted)] mb-3">
            Income Waterfall
          </p>
          <Row label="Combined gross income" 
            value={formatCompactCurrency(combinedGross)} bold />
          <Row label={`Pre-tax savings (${(inputs.preTaxSavingsRate*100).toFixed(0)}% of gross)`}
            value={`-${formatCompactCurrency(preTaxDeductions)}`}
            indent color="danger" />
          <Row label="Standard deduction" 
            value={`-${formatCompactCurrency(stdDeduction)}`}
            indent color="danger" />
          <Row label="Adjusted gross income (AGI)"
            value={formatCompactCurrency(agi)} bold border />
          <Row label="Federal income tax"
            value={`-${formatCompactCurrency(fedTaxAfterCredit)}`}
            indent color="danger" />
          {effectiveChildCredit > 0 && (
            <Row label={`Child tax credit (${inputs.numDependents} kids)`}
              value={`+${formatCompactCurrency(effectiveChildCredit)}`}
              indent color="success" />
          )}
          <Row label="FICA (SS + Medicare)"
            value={`-${formatCompactCurrency(totalFICA)}`}
            indent color="danger" />
          <Row label={`State tax (${(inputs.stateIncomeTaxRate*100).toFixed(1)}%)`}
            value={`-${formatCompactCurrency(stateTax)}`}
            indent color="danger" />
          <Row label="After-tax take-home"
            value={formatCompactCurrency(afterTax)} bold border color="accent" />
          <Row label={`After-tax savings (${(inputs.afterTaxSavingsRate*100).toFixed(0)}%)`}
            value={`-${formatCompactCurrency(afterTax * inputs.afterTaxSavingsRate)}`}
            indent color="danger" />
          <Row label="Annual spendable income"
            value={formatCompactCurrency(spendable)} bold border color="success" />
        </div>

        {/* Right: Federal bracket breakdown */}
        <div className="rounded-lg border border-[var(--border)] 
          bg-[var(--bg-card)] p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest 
            text-[var(--text-muted)] mb-1">
            Federal Tax Brackets
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mb-3">
            2024 {isMFJ ? 'Married Filing Jointly' : 'Single'} | 
            AGI: {formatCompactCurrency(agi)} | 
            Marginal rate: {(marginalRate * 100).toFixed(0)}%
          </p>
          
          <div className="grid gap-1.5">
            {brackets.map((bracket) => (
              <div key={bracket.rate}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="font-bold text-[var(--text-primary)]">
                    {bracket.rate} bracket
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {bracket.income} income = {bracket.tax} tax
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${bracket.filled}%`,
                      background: bracket.filled === 0 
                        ? 'transparent'
                        : bracket.rate === '10%' ? '#22c55e'
                        : bracket.rate === '12%' ? '#84cc16'
                        : bracket.rate === '22%' ? '#eab308'
                        : bracket.rate === '24%' ? '#f97316'
                        : bracket.rate === '32%' ? '#ef4444'
                        : bracket.rate === '35%' ? '#dc2626'
                        : '#991b1b'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded border border-[var(--border)] 
              p-2 text-center">
              <p className="text-sm font-bold text-[var(--danger)]">
                {formatPercentage(effectiveRate, 1)}
              </p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase">
                Effective Rate
              </p>
            </div>
            <div className="rounded border border-[var(--border)] 
              p-2 text-center">
              <p className="text-sm font-bold text-[var(--warning)]">
                {(marginalRate * 100).toFixed(0)}%
              </p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase">
                Marginal Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Annual savings summary */}
      <div className="rounded-lg border border-[var(--border)] 
        bg-[var(--bg-card)] p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest 
          text-[var(--text-muted)] mb-3">
          Annual Savings Breakdown
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded border border-[var(--border)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--accent)]">
              {formatCompactCurrency(preTaxDeductions)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Pre-Tax (401k/HSA)
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">
              {(inputs.preTaxSavingsRate * 100).toFixed(0)}% of gross
            </p>
          </div>
          <div className="rounded border border-[var(--border)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--accent)]">
              {formatCompactCurrency(afterTax * inputs.afterTaxSavingsRate)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              After-Tax Savings
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">
              {(inputs.afterTaxSavingsRate * 100).toFixed(0)}% of take-home
            </p>
          </div>
          <div className="rounded border border-[var(--border)] p-3 text-center">
            <p className="text-lg font-bold text-[var(--success)]">
              {formatCompactCurrency(saved)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Total Annual Savings
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">
              {formatPercentage(saved / combinedGross, 0)} of gross
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] text-center">
        Estimates based on 2024 federal brackets. Does not include 
        AMT, state-specific deductions, capital gains, or investment 
        income. Consult a tax advisor for personalized guidance.
      </p>
    </div>
  );
}