import { Info, Trash2, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { AgeInput } from "../../components/inputs/AgeInput";
import { CurrencyInput } from "../../components/inputs/CurrencyInput";
import { SliderInput } from "../../components/inputs/SliderInput";
import { getInvestableAssets, getTotalNetWorth, calculateSmartSpendingDefaults } from "../../engine/monteCarlo";
import { formatCompactCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useSimStore } from "../../store/useSimStore";
import type { CarryAward } from "../../types";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">{children}</span>;
}

function HelpTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex size-5 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          onClick={(event) => event.stopPropagation()}
        >
          <Info size={12} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] rounded-md border border-[var(--border)] bg-[#1e293b] p-3 text-xs leading-relaxed text-[var(--text-primary)] shadow-xl">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function SectionTrigger({ title, summary, help }: { title: string; summary: string; help?: string }) {
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-left">{title}</span>
        {help ? <HelpTip text={help} /> : null}
      </span>
      <Chip>{summary}</Chip>
    </span>
  );
}

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const inputs = useSimStore((state) => state.inputs);
  const errors = useSimStore((state) => state.errors);
  const setInput = useSimStore((state) => state.setInput);
  const addCarryAward = useSimStore((state) => state.addCarryAward);
  const updateCarryAward = useSimStore((state) => state.updateCarryAward);
  const removeCarryAward = useSimStore((state) => state.removeCarryAward);
  const applySmartSpendingDefaults = useSimStore((state) => state.applySmartSpendingDefaults);
  
  const investable = getInvestableAssets(inputs);
  const totalNW = getTotalNetWorth(inputs);
  const gross = investable + inputs.illiquidAssets;
  const liquidPct = gross > 0 ? (investable / gross) * 100 : 0;
  const spendingDefaults = calculateSmartSpendingDefaults(inputs);
  const combinedIncome = inputs.annualSalary + (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
  const carryEffective = inputs.carryAwards.reduce((sum, award) => sum + award.totalPoolValue * award.poolValueCapture * award.vestedPercent, 0);
  const totalCollegeNeed = inputs.collegeEvents.reduce((sum, event) => sum + Math.max(0, event.annualCost * event.years - event.existingSavings529), 0);

  return (
    <aside className={`${mobile ? "max-h-[85vh]" : "h-[calc(100vh-56px)] lg:sticky lg:top-[56px]"} sidebar-scroll flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]`}>
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        <Accordion type="multiple" defaultValue={["you", "assets"]} className="grid gap-2">
          <AccordionItem value="you" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger><SectionTrigger title="You & Your Spouse" summary={`${inputs.currentAge} -> ${inputs.retirementAge} / ${inputs.planningAge}`} /></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <AgeInput label="Your age" value={inputs.currentAge} min={30} max={70} error={errors.currentAge} onChange={(value) => setInput("currentAge", value)} />
                <AgeInput label="Retire age" value={inputs.retirementAge} min={40} max={75} error={errors.retirementAge} onChange={(value) => setInput("retirementAge", value)} />
              </div>
              <AgeInput label="Plan to age" value={inputs.planningAge} min={75} max={100} error={errors.planningAge} onChange={(value) => setInput("planningAge", value)} />
              <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white/[0.03] px-3 py-1.5">
                <span className="text-xs font-medium">Include spouse?</span>
                <Switch checked={inputs.hasSpouse} onCheckedChange={(checked) => setInput("hasSpouse", checked)} />
              </div>
              {inputs.hasSpouse && (
                <div className="grid grid-cols-2 gap-2">
                  <AgeInput label="Spouse age" value={inputs.spouseCurrentAge} min={30} max={70} error={errors.spouseCurrentAge} onChange={(value) => setInput("spouseCurrentAge", value)} />
                  <AgeInput label="Spouse retire" value={inputs.spouseRetirementAge} min={40} max={75} error={errors.spouseRetirementAge} onChange={(value) => setInput("spouseRetirementAge", value)} />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assets" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger><SectionTrigger title="Your Assets" summary={`${formatCompactCurrency(investable)} investable`} /></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <CurrencyInput label="Taxable brokerage" value={inputs.taxableAssets} max={20_000_000} step={25_000} error={errors.taxableAssets} onChange={(value) => setInput("taxableAssets", value)} />
              <CurrencyInput label="Traditional 401k / IRA" value={inputs.taxDeferredAssets} max={10_000_000} step={25_000} error={errors.taxDeferredAssets} onChange={(value) => setInput("taxDeferredAssets", value)} />
              <CurrencyInput label="Roth / tax-free" value={inputs.taxFreeAssets} max={10_000_000} step={25_000} error={errors.taxFreeAssets} onChange={(value) => setInput("taxFreeAssets", value)} />
              <CurrencyInput label="Cash / emergency fund" value={inputs.cashReserves} max={5_000_000} step={10_000} error={errors.cashReserves} onChange={(value) => setInput("cashReserves", value)} />
              <CurrencyInput label="Illiquid assets incl. home" value={inputs.illiquidAssets} max={30_000_000} step={50_000} error={errors.illiquidAssets} onChange={(value) => setInput("illiquidAssets", value)} />
              <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total net worth</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{formatCompactCurrency(totalNW)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Investable assets</span>
                  <span className="text-sm font-bold text-[var(--accent)]">{formatCompactCurrency(investable)} ({liquidPct.toFixed(0)}% liquid)</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spending" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              <SectionTrigger
                title="Spending Plan"
                summary={`${formatCompactCurrency(inputs.spendingGoGo)}/yr`}
                help="Spending is entered in today's dollars. During retirement, Terminus inflates each year's target and follows the go-go, slow-go, and no-go spending smile."
              />
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <div className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1.5">
                <span className="text-[10px] text-[var(--text-muted)]">
                  Suggested: <span className="font-bold text-[var(--text-primary)]">{formatCompactCurrency(spendingDefaults.goGo)}/yr</span>
                  <span className="ml-1 opacity-60">({spendingDefaults.basis}; Apply uses the 85% Monte Carlo solver when stable)</span>
                </span>
                <button
                  onClick={applySmartSpendingDefaults}
                  className="ml-2 rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors shrink-0"
                >
                  Apply
                </button>
              </div>
              <SliderInput 
                label="Go-Go spending (active early retirement)" 
                value={inputs.spendingGoGo} 
                min={50000} max={500000} step={5000} 
                format="currency"
                error={errors.spendingGoGo}
                onChange={(v) => setInput('spendingGoGo', v)} 
              />
              <SliderInput 
                label="Slow-Go spending (mid retirement)" 
                value={inputs.spendingSlowGo} 
                min={30000} max={400000} step={5000} 
                format="currency"
                error={errors.spendingSlowGo}
                onChange={(v) => setInput('spendingSlowGo', v)} 
              />
              <SliderInput 
                label="No-Go spending (late retirement)" 
                value={inputs.spendingNoGo} 
                min={20000} max={300000} step={5000} 
                format="currency"
                error={errors.spendingNoGo}
                onChange={(v) => setInput('spendingNoGo', v)} 
              />
              <SliderInput 
                label="Healthcare surge (no-go phase add-on)" 
                value={inputs.healthcareSurgeAmount} 
                min={0} max={60000} step={2500} 
                format="currency"
                error={errors.healthcareSurgeAmount}
                onChange={(v) => setInput('healthcareSurgeAmount', v)} 
              />
              <SliderInput 
                label="Go-Go phase length (years)" 
                value={inputs.goGoYears} 
                min={5} max={15} step={1}
                error={errors.goGoYears}
                onChange={(v) => setInput('goGoYears', v)} 
              />
              <SliderInput 
                label="Slow-Go phase length (years)" 
                value={inputs.slowGoYears} 
                min={5} max={15} step={1}
                error={errors.slowGoYears}
                onChange={(v) => setInput('slowGoYears', v)} 
              />
              <SliderInput 
                label="Inflation rate" 
                value={inputs.inflationRate} 
                min={0} max={0.1} step={0.001} 
                format="percent"
                error={errors.inflationRate}
                onChange={(v) => setInput('inflationRate', v)} 
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="market" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger><SectionTrigger title="Market" summary={`${(inputs.expectedReturn * 100).toFixed(1)}% / ${(inputs.volatility * 100).toFixed(0)}% vol`} /></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <SliderInput label="Expected Return" value={inputs.expectedReturn} min={0.01} max={0.15} step={0.005} format="percent" error={errors.expectedReturn} onChange={(v) => setInput("expectedReturn", v)} />
              <SliderInput label="Volatility" value={inputs.volatility} min={0.01} max={0.3} step={0.01} format="percent" error={errors.volatility} onChange={(v) => setInput("volatility", v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="income" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              <SectionTrigger
                title="Income & Social Security"
                summary={`${formatCompactCurrency(combinedIncome)}/yr | SS ${inputs.socialSecurityAge}`}
                help="Social Security starts only after retirement and only after each spouse reaches their own claiming age. Benefits are adjusted for claiming age and haircut for trust-fund uncertainty."
              />
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <CurrencyInput label="Your annual salary (pre-retirement)" value={inputs.annualSalary} max={2000000} step={25000} error={errors.annualSalary} onChange={(v) => setInput('annualSalary', v)} />
              {inputs.hasSpouse && (
                <CurrencyInput label="Spouse annual salary" value={inputs.spouseAnnualSalary} max={2000000} step={25000} error={errors.spouseAnnualSalary} onChange={(v) => setInput('spouseAnnualSalary', v)} />
              )}
              <SliderInput label="Your Social Security claiming age" value={inputs.socialSecurityAge} min={62} max={70} step={1} error={errors.socialSecurityAge} onChange={(v) => setInput('socialSecurityAge', v)} />
              <CurrencyInput label="Your SS annual benefit" value={inputs.socialSecurityAmount} max={60000} step={1000} error={errors.socialSecurityAmount} onChange={(v) => setInput('socialSecurityAmount', v)} />
              {inputs.hasSpouse && (
                <>
                  <SliderInput label="Spouse SS claiming age" value={inputs.spouseSocialSecurityAge} min={62} max={70} step={1} error={errors.spouseSocialSecurityAge} onChange={(v) => setInput('spouseSocialSecurityAge', v)} />
                  <CurrencyInput label="Spouse SS annual benefit" value={inputs.spouseSocialSecurityAmount} max={60000} step={1000} error={errors.spouseSocialSecurityAmount} onChange={(v) => setInput('spouseSocialSecurityAmount', v)} />
                </>
              )}
              <CurrencyInput label="Other annual retirement income" value={inputs.otherRetirementIncome} max={500000} step={5000} error={errors.otherRetirementIncome} onChange={(v) => setInput('otherRetirementIncome', v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tax" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              <SectionTrigger
                title="Tax & Savings"
                summary={`${(inputs.stateIncomeTaxRate * 100).toFixed(1)}% state | ${((inputs.preTaxSavingsRate + inputs.afterTaxSavingsRate) * 100).toFixed(0)}% save`}
                help="Working years use federal brackets, FICA, state tax, and savings rates. Retirement withdrawals now come from actual buckets: cash, taxable, tax-deferred, then Roth/tax-free."
              />
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <div className="grid gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Filing Status
                </span>
                <div className="flex gap-2">
                  {(['mfj', 'single'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setInput('filingStatus', status)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-xs font-bold transition-colors",
                        inputs.filingStatus === status
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      )}
                    >
                      {status === 'mfj' ? 'Married Filing Jointly' : 'Single'}
                    </button>
                  ))}
                </div>
              </div>
              
              <SliderInput label="Number of dependents" value={inputs.numDependents} min={0} max={5} step={1} error={errors.numDependents} onChange={(v) => setInput('numDependents', v)} />
              <SliderInput label="State income tax rate" value={inputs.stateIncomeTaxRate} min={0} max={0.133} step={0.001} format="percent" error={errors.stateIncomeTaxRate} onChange={(v) => setInput('stateIncomeTaxRate', v)} />
              <SliderInput label="Pre-tax savings rate" value={inputs.preTaxSavingsRate} min={0} max={0.30} step={0.01} format="percent" error={errors.preTaxSavingsRate} onChange={(v) => setInput('preTaxSavingsRate', v)} />
              <SliderInput label="After-tax savings rate" value={inputs.afterTaxSavingsRate} min={0} max={0.60} step={0.01} format="percent" error={errors.afterTaxSavingsRate} onChange={(v) => setInput('afterTaxSavingsRate', v)} />
              
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2 grid gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Estimated Tax Breakdown</p>
                {(() => {
                  const combined = inputs.annualSalary + (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
                  const preTax = combined * inputs.preTaxSavingsRate;
                  const taxable = Math.max(0, combined - preTax);
                  const stdDed = inputs.filingStatus === 'mfj' ? 30000 : 15000;
                  const agi = Math.max(0, taxable - stdDed);
                  const approxFedRate = agi > 731200 ? 0.37 : agi > 487450 ? 0.35 : agi > 383900 ? 0.32 : agi > 201050 ? 0.24 : agi > 94300 ? 0.22 : 0.12;
                  const approxFedTax = agi * approxFedRate * 0.72;
                  const approxFica = Math.min(combined, 176100) * 0.062 + combined * 0.0145;
                  const approxState = taxable * inputs.stateIncomeTaxRate;
                  const totalTax = approxFedTax + approxFica + approxState;
                  const afterTax = combined - totalTax;
                  const saved = afterTax * inputs.afterTaxSavingsRate + preTax;
                  return (
                    <div className="grid gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Gross income</span>
                        <span className="font-bold">{formatCompactCurrency(combined)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Est. total tax</span>
                        <span className="font-bold text-[var(--danger)]">-{formatCompactCurrency(totalTax)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1">
                        <span className="text-[var(--text-muted)]">Est. annual savings</span>
                        <span className="font-bold text-[var(--success)]">{formatCompactCurrency(saved)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="carry" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              <SectionTrigger
                title="Carry Awards"
                summary={inputs.carryAwards.length === 0 ? "0 awards" : `${inputs.carryAwards.length} | ${formatCompactCurrency(carryEffective)} effective`}
                help="Carry is modeled as net after-tax distributions over a 12-year fund curve, offset by GP commit outflows in the first three fund years."
              />
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              {errors.carryAwards && <p className="text-[10px] text-[var(--danger)]">{errors.carryAwards}</p>}
              {inputs.carryAwards.length === 0 && <p className="text-center text-xs text-[var(--text-muted)] py-4">No carry awards added.</p>}

              {inputs.carryAwards.map((award) => (
                <div key={award.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Award Item</span>
                    <button onClick={() => removeCarryAward(award.id)} className="text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded p-1 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <Input value={award.label} onChange={(e) => updateCarryAward({ ...award, label: e.target.value })} className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                        Vintage Year
                      </label>
                      <Input
                        type="number"
                        value={award.vintageYear}
                        min={2010}
                        max={2040}
                        onChange={(e) => updateCarryAward({ ...award, vintageYear: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-semibold uppercase text-[var(--text-muted)]">
                        Your Award Value ($)
                      </label>
                      <Input
                        type="number"
                        value={award.totalPoolValue}
                        onChange={(e) => updateCarryAward({ ...award, totalPoolValue: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <SliderInput
                    label="Pool Value Capture % (conservatism discount)"
                    value={award.poolValueCapture}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateCarryAward({ ...award, poolValueCapture: v })}
                  />
                  <SliderInput
                    label="Vested %"
                    value={award.vestedPercent}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateCarryAward({ ...award, vestedPercent: v })}
                  />
                  <SliderInput
                    label="GP Commit % of Award Value"
                    value={award.gpCommitPercent}
                    min={0}
                    max={0.25}
                    step={0.01}
                    format="percent"
                    onChange={(v) => updateCarryAward({ ...award, gpCommitPercent: v })}
                  />

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2 grid gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      Award Summary
                    </p>
                    <div className="grid gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Effective award (after capture %)</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {formatCompactCurrency(award.totalPoolValue * award.poolValueCapture * award.vestedPercent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Total GP commit</span>
                        <span className="font-bold text-[var(--danger)]">
                          -{formatCompactCurrency(award.totalPoolValue * award.gpCommitPercent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">GP commit per year (3 yrs)</span>
                        <span className="font-bold text-[var(--danger)]">
                          -{formatCompactCurrency((award.totalPoolValue * award.gpCommitPercent) / 3)}/yr
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-0.5">
                        <span className="text-[var(--text-muted)]">First distribution</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {award.vintageYear + 2}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Peak years (Fund Yr 7-9)</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {award.vintageYear + 6} - {award.vintageYear + 8}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                onClick={() =>
                  addCarryAward({
                    id: Math.random().toString(36).substr(2, 9),
                    label: `Carry Award ${inputs.carryAwards.length + 1}`,
                    vintageYear: new Date().getFullYear(),
                    totalPoolValue: 1_000_000,
                    poolValueCapture: 0.75,
                    vestedPercent: 1.0,
                    gpCommitPercent: 0.12,
                  })
                }
                variant="secondary"
                className="w-full text-xs border-dashed"
              >
                <Plus size={14} className="mr-2" /> Add Carry Award
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="liabilities" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger><SectionTrigger title="Liabilities & Obligations" summary={`${formatCompactCurrency(inputs.mortgageBalance)} mortgage`} /></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3000000} error={errors.mortgageBalance} onChange={(v) => setInput('mortgageBalance', v)} />
              <CurrencyInput label="Annual mortgage payment" value={inputs.mortgageAnnualPayment} max={250000} step={5000} error={errors.mortgageAnnualPayment} onChange={(v) => setInput('mortgageAnnualPayment', v)} />
              <SliderInput label="Years remaining on mortgage" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} error={errors.mortgageYearsRemaining} onChange={(v) => setInput('mortgageYearsRemaining', v)} />
              <CurrencyInput label="Annual capital call obligations" value={inputs.capitalCallObligations} max={500000} step={10000} error={errors.capitalCallObligations} onChange={(v) => setInput('capitalCallObligations', v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="college" className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger><SectionTrigger title="College & Kids" summary={`${inputs.collegeEvents.length} kids | ${formatCompactCurrency(totalCollegeNeed)}`} /></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <p className="text-[11px] text-[var(--text-muted)]">College costs modeled as annual withdrawals net of 529 savings.</p>
              {errors.collegeEvents && <p className="text-[10px] text-[var(--danger)]">{errors.collegeEvents}</p>}
              {inputs.collegeEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2 grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{event.childName}</span>
                    <button className="text-[var(--danger)] text-xs" onClick={() => {
                      const updated = inputs.collegeEvents.filter(e => e.id !== event.id);
                      setInput('collegeEvents', updated);
                    }}>Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">Start Age</span>
                      <input type="number" value={event.startYear} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? { ...ev, startYear: Number(e.target.value) } : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">Annual Cost</span>
                      <input type="number" value={event.annualCost} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? { ...ev, annualCost: Number(e.target.value) } : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">Years</span>
                      <input type="number" value={event.years} min={1} max={6} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? { ...ev, years: Number(e.target.value) } : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">529 balance</span>
                      <input type="number" value={event.existingSavings529} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? { ...ev, existingSavings529: Number(e.target.value) } : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Total: {formatCompactCurrency(Math.max(0, event.annualCost * event.years - event.existingSavings529))} net
                  </p>
                </div>
              ))}
              <Button onClick={() => {
                const newEvent = { id: Math.random().toString(36).substr(2, 9), childName: `Child ${inputs.collegeEvents.length + 1}`, startYear: inputs.currentAge + 18, annualCost: 85000, years: 4, existingSavings529: 100000 };
                setInput('collegeEvents', [...inputs.collegeEvents, newEvent]);
              }} variant="secondary" className="w-full text-xs border-dashed"><Plus size={14} className="mr-2" /> Add Child</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="border-r border-[var(--border)] pr-4">
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Net Worth</p>
            <div className="text-sm font-bold"><AnimatedNumber value={totalNW} format="currency" /></div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Investable</p>
            <div className="text-sm font-bold"><AnimatedNumber value={investable} format="currency" /></div>
          </div>
          <div className="border-t border-r border-[var(--border)] pr-4 pt-2">
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Illiquid</p>
            <div className="text-sm font-bold">{formatCompactCurrency(inputs.illiquidAssets)}</div>
          </div>
          <div className="border-t border-[var(--border)] pt-2">
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Liquidity</p>
            <div className="text-sm font-bold text-[var(--accent)]">{liquidPct.toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
