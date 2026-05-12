import { Trash2, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
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
  return <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[11px] text-[var(--text-muted)]">{children}</span>;
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

  return (
    <aside className={`${mobile ? "max-h-[85vh]" : "h-[calc(100vh-56px)] lg:sticky lg:top-[56px]"} sidebar-scroll flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]`}>
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        <Accordion type="multiple" defaultValue={["you", "assets"]} className="grid gap-2">
          <AccordionItem value="you" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>You & Your Spouse <Chip>Retire {inputs.retirementAge}</Chip></AccordionTrigger>
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
                  <AgeInput label="Spouse age" value={inputs.spouseCurrentAge} min={30} max={70} onChange={(value) => setInput("spouseCurrentAge", value)} />
                  <AgeInput label="Spouse retire" value={inputs.spouseRetirementAge} min={40} max={75} onChange={(value) => setInput("spouseRetirementAge", value)} />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assets" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>Your Assets <Chip>{formatCompactCurrency(investable)} liquid</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] mb-0.5">Taxable</p>
                  <input type="number" value={inputs.taxableAssets} onChange={(e) => setInput("taxableAssets", Number(e.target.value))} className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-primaryText outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] mb-0.5">Traditional (401k/IRA)</p>
                  <input type="number" value={inputs.taxDeferredAssets} onChange={(e) => setInput("taxDeferredAssets", Number(e.target.value))} className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-primaryText outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] mb-0.5">Roth (401k/IRA)</p>
                  <input type="number" value={inputs.taxFreeAssets} onChange={(e) => setInput("taxFreeAssets", Number(e.target.value))} className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-primaryText outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] mb-0.5">Cash</p>
                  <input type="number" value={inputs.cashReserves} onChange={(e) => setInput("cashReserves", Number(e.target.value))} className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-primaryText outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] mb-0.5">Illiquid (incl. home)</p>
                <input type="number" value={inputs.illiquidAssets} onChange={(e) => setInput("illiquidAssets", Number(e.target.value))} className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 text-xs text-primaryText outline-none focus:border-[var(--accent)]" />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spending" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              Spending Plan
              <Chip>{formatCompactCurrency(inputs.spendingGoGo)}/yr</Chip>
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <div className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1.5">
                <span className="text-[10px] text-[var(--text-muted)]">
                  Suggested: <span className="font-bold text-[var(--text-primary)]">{formatCompactCurrency(spendingDefaults.goGo)}/yr</span>
                  <span className="ml-1 opacity-60">({spendingDefaults.basis})</span>
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
                onChange={(v) => setInput('spendingGoGo', v)} 
              />
              <SliderInput 
                label="Slow-Go spending (mid retirement)" 
                value={inputs.spendingSlowGo} 
                min={30000} max={400000} step={5000} 
                format="currency"
                onChange={(v) => setInput('spendingSlowGo', v)} 
              />
              <SliderInput 
                label="No-Go spending (late retirement)" 
                value={inputs.spendingNoGo} 
                min={20000} max={300000} step={5000} 
                format="currency"
                onChange={(v) => setInput('spendingNoGo', v)} 
              />
              <SliderInput 
                label="Healthcare surge (no-go phase add-on)" 
                value={inputs.healthcareSurgeAmount} 
                min={0} max={60000} step={2500} 
                format="currency"
                onChange={(v) => setInput('healthcareSurgeAmount', v)} 
              />
              <SliderInput 
                label="Go-Go phase length (years)" 
                value={inputs.goGoYears} 
                min={5} max={15} step={1}
                onChange={(v) => setInput('goGoYears', v)} 
              />
              <SliderInput 
                label="Slow-Go phase length (years)" 
                value={inputs.slowGoYears} 
                min={5} max={15} step={1}
                onChange={(v) => setInput('slowGoYears', v)} 
              />
              <SliderInput 
                label="Inflation rate" 
                value={inputs.inflationRate} 
                min={0} max={0.1} step={0.001} 
                format="percent"
                onChange={(v) => setInput('inflationRate', v)} 
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="market" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>Market <Chip>{(inputs.expectedReturn * 100).toFixed(1)}% Return</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <SliderInput label="Expected Return" value={inputs.expectedReturn} min={0.01} max={0.15} step={0.005} format="percent" onChange={(v) => setInput("expectedReturn", v)} />
              <SliderInput label="Volatility" value={inputs.volatility} min={0.01} max={0.3} step={0.01} format="percent" onChange={(v) => setInput("volatility", v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="income" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              Income & Social Security
              <Chip>SS {inputs.socialSecurityAge}</Chip>
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <CurrencyInput label="Your annual salary (pre-retirement)" value={inputs.annualSalary} max={2000000} step={25000} onChange={(v) => setInput('annualSalary', v)} />
              {inputs.hasSpouse && (
                <CurrencyInput label="Spouse annual salary" value={inputs.spouseAnnualSalary} max={2000000} step={25000} onChange={(v) => setInput('spouseAnnualSalary', v)} />
              )}
              <SliderInput label="Your Social Security claiming age" value={inputs.socialSecurityAge} min={62} max={70} step={1} onChange={(v) => setInput('socialSecurityAge', v)} />
              <CurrencyInput label="Your SS annual benefit" value={inputs.socialSecurityAmount} max={60000} step={1000} onChange={(v) => setInput('socialSecurityAmount', v)} />
              {inputs.hasSpouse && (
                <>
                  <SliderInput label="Spouse SS claiming age" value={inputs.spouseSocialSecurityAge} min={62} max={70} step={1} onChange={(v) => setInput('spouseSocialSecurityAge', v)} />
                  <CurrencyInput label="Spouse SS annual benefit" value={inputs.spouseSocialSecurityAmount} max={60000} step={1000} onChange={(v) => setInput('spouseSocialSecurityAmount', v)} />
                </>
              )}
              <CurrencyInput label="Other annual retirement income" value={inputs.otherRetirementIncome} max={500000} step={5000} onChange={(v) => setInput('otherRetirementIncome', v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tax" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              Tax & Savings
              <Chip>
                {(inputs.stateIncomeTaxRate * 100).toFixed(0)}% state
              </Chip>
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
              
              <SliderInput label="Number of dependents" value={inputs.numDependents} min={0} max={5} step={1} onChange={(v) => setInput('numDependents', v)} />
              <SliderInput label="State income tax rate" value={inputs.stateIncomeTaxRate} min={0} max={0.133} step={0.001} format="percent" onChange={(v) => setInput('stateIncomeTaxRate', v)} />
              <SliderInput label="Pre-tax savings rate" value={inputs.preTaxSavingsRate} min={0} max={0.30} step={0.01} format="percent" onChange={(v) => setInput('preTaxSavingsRate', v)} />
              <SliderInput label="After-tax savings rate" value={inputs.afterTaxSavingsRate} min={0} max={0.60} step={0.01} format="percent" onChange={(v) => setInput('afterTaxSavingsRate', v)} />
              
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

          <AccordionItem value="carry" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              Carry Awards
              <Chip>
                {inputs.carryAwards.length === 0
                  ? "0 awards"
                  : `${inputs.carryAwards.length} award${inputs.carryAwards.length > 1 ? "s" : ""} | ${formatCompactCurrency(
                      inputs.carryAwards.reduce(
                        (sum, a) => sum + a.totalPoolValue * a.poolValueCapture * a.vestedPercent,
                        0
                      )
                    )} effective`}
              </Chip>
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              {inputs.carryAwards.length === 0 && <p className="text-center text-xs text-[var(--text-muted)] py-4">No carry awards added.</p>}

              {inputs.carryAwards.map((award) => (
                <div key={award.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 grid gap-2">
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

          <AccordionItem value="liabilities" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>Liabilities & Obligations <Chip>{formatCompactCurrency(inputs.mortgageBalance)}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3000000} onChange={(v) => setInput('mortgageBalance', v)} />
              <CurrencyInput label="Annual mortgage payment" value={inputs.mortgageAnnualPayment} max={250000} step={5000} onChange={(v) => setInput('mortgageAnnualPayment', v)} />
              <SliderInput label="Years remaining on mortgage" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} onChange={(v) => setInput('mortgageYearsRemaining', v)} />
              <CurrencyInput label="Annual capital call obligations" value={inputs.capitalCallObligations} max={500000} step={10000} onChange={(v) => setInput('capitalCallObligations', v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="college" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>College & Kids <Chip>{inputs.collegeEvents.length} kids</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <p className="text-[11px] text-[var(--text-muted)]">College costs modeled as annual withdrawals net of 529 savings.</p>
              {inputs.collegeEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-[var(--border)] bg-white/[0.03] p-2 grid gap-2">
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
