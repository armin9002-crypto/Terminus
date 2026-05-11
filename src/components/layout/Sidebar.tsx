import { Trash2, Plus } from "lucide-react";
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
import type { LumpyEvent } from "../../types";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[11px] text-[var(--text-muted)]">{children}</span>;
}

function confidenceToProbability(confidence: LumpyEvent["confidence"]) {
  if (confidence === "low") return 0.4;
  if (confidence === "high") return 0.9;
  return 0.7;
}

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const inputs = useSimStore((state) => state.inputs);
  const errors = useSimStore((state) => state.errors);
  const setInput = useSimStore((state) => state.setInput);
  const setInputs = useSimStore((state) => state.setInputs);
  const addLumpyEvent = useSimStore((state) => state.addLumpyEvent);
  const updateLumpyEvent = useSimStore((state) => state.updateLumpyEvent);
  const removeLumpyEvent = useSimStore((state) => state.removeLumpyEvent);
  const applySmartSpendingDefaults = useSimStore((state) => state.applySmartSpendingDefaults);
  
  const investable = getInvestableAssets(inputs);
  const totalNW = getTotalNetWorth(inputs);
  const gross = investable + inputs.illiquidAssets;
  const liquidPct = gross > 0 ? (investable / gross) * 100 : 0;
  const spendingDefaults = calculateSmartSpendingDefaults(inputs);

  return (
    <aside className={`${mobile ? "max-h-[85vh]" : "h-[calc(100vh-56px)] lg:sticky lg:top-[56px]"} sidebar-scroll flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]`}>
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <Accordion type="multiple" defaultValue={["you", "assets"]} className="grid gap-3">
          <AccordionItem value="you" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>You & Your Spouse <Chip>Retire {inputs.retirementAge}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <AgeInput label="Your current age" value={inputs.currentAge} min={30} max={70} error={errors.currentAge} onChange={(value) => setInput("currentAge", value)} />
              <AgeInput label="Your retirement age" value={inputs.retirementAge} min={40} max={75} error={errors.retirementAge} onChange={(value) => setInput("retirementAge", value)} />
              <AgeInput label="Live to age" value={inputs.planningAge} min={75} max={100} error={errors.planningAge} onChange={(value) => setInput("planningAge", value)} />
              <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white/[0.03] p-3">
                <span className="text-sm font-medium">Include spouse?</span>
                <Switch checked={inputs.hasSpouse} onCheckedChange={(checked) => setInput("hasSpouse", checked)} />
              </div>
              {inputs.hasSpouse && (
                <>
                  <AgeInput label="Spouse current age" value={inputs.spouseCurrentAge} min={30} max={70} onChange={(value) => setInput("spouseCurrentAge", value)} />
                  <AgeInput label="Spouse retirement age" value={inputs.spouseRetirementAge} min={40} max={75} onChange={(value) => setInput("spouseRetirementAge", value)} />
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="assets" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>Your Assets <Chip>{formatCompactCurrency(investable)} liquid</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <CurrencyInput label="Taxable Brokerage" value={inputs.taxableAssets} onChange={(v) => setInput("taxableAssets", v)} />
              <CurrencyInput label="Traditional (401K / IRA)" value={inputs.taxDeferredAssets} onChange={(v) => setInput("taxDeferredAssets", v)} />
              <CurrencyInput label="Roth (401K / IRA)" value={inputs.taxFreeAssets} onChange={(v) => setInput("taxFreeAssets", v)} />
              <CurrencyInput label="Illiquid Assets (incl. Home)" value={inputs.illiquidAssets} onChange={(v) => setInput("illiquidAssets", v)} />
              <CurrencyInput label="Cash Reserves" value={inputs.cashReserves} onChange={(v) => setInput("cashReserves", v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="spending" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>
              Spending Plan
              <Chip>{formatCompactCurrency(inputs.spendingGoGo)}/yr</Chip>
            </AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                The spending smile: high spending in active retirement,
                less in mid-retirement, then healthcare costs rise late.
              </p>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-primary)]">
                    Smart suggestion
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    Go-Go: {formatCompactCurrency(spendingDefaults.goGo)}/yr
                    based on {spendingDefaults.basis}
                  </p>
                </div>
                <button
                  onClick={applySmartSpendingDefaults}
                  className="rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
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
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                FRA is 67 for those born 1960+. Claiming at 62 reduces 
                benefit ~30%. Delaying to 70 increases it ~24%. A 15% 
                haircut is applied for SS trust fund uncertainty 
                (projected ~2033-2035).
              </p>
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
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Federal taxes use 2024 MFJ or Single brackets with 
                standard deduction and child tax credits. FICA applies 
                during working years only. State tax is a flat-rate 
                approximation.
              </p>
              
              <div className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
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
                  const stdDed = inputs.filingStatus === 'mfj' ? 29200 : 14600;
                  const agi = Math.max(0, taxable - stdDed);
                  const approxFedRate = agi > 731200 ? 0.37 : agi > 487450 ? 0.35 : agi > 383900 ? 0.32 : agi > 201050 ? 0.24 : agi > 94300 ? 0.22 : 0.12;
                  const approxFedTax = agi * approxFedRate * 0.72;
                  const approxFica = Math.min(combined, 168600) * 0.062 + combined * 0.0145;
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

          <AccordionItem value="events" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <AccordionTrigger>Lumpy Events <Chip>{inputs.lumpyEvents.length}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-2">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2">
                <p className="text-[11px] font-bold text-[var(--text-primary)] mb-1">What are lumpy events?</p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  One-time cash events like carried interest, real estate sales, or capital calls.
                  Confidence affects how often this fires across simulations.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Quick Add</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Carry', type: 'carry', sub: 'LTCG Taxed' },
                    { label: 'RE Sale', type: 're', sub: 'LTCG Taxed' },
                    { label: 'Bonus', type: 'bonus', sub: 'Ordinary Tax' },
                    { label: 'Cap Call', type: 'call', sub: 'Outflow' },
                  ].map(btn => (
                    <button
                      key={btn.type}
                      onClick={() => {
                        const defaults = btn.type === 'carry' ? { label: "Carry Distribution", taxType: "ltcg" as const, amount: 1500000, confidence: "medium" as const, probability: 0.7 }
                          : btn.type === 're' ? { label: "Real Estate Sale", taxType: "ltcg" as const, amount: 800000, confidence: "medium" as const, probability: 0.8 }
                          : btn.type === 'bonus' ? { label: "Annual Bonus", taxType: "ordinary" as const, amount: 300000, confidence: "high" as const, probability: 0.9 }
                          : { label: "Capital Call", taxType: "none" as const, amount: -250000, confidence: "high" as const, probability: 1.0 };
                        addLumpyEvent({ id: Math.random().toString(36).substr(2, 9), year: inputs.currentAge + 5, ...defaults });
                      }}
                      className="flex flex-col items-start rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-2.5 text-left hover:border-[var(--accent)] transition-colors"
                    >
                      <span className="text-xs font-bold text-[var(--text-primary)]">{btn.label}</span>
                      <span className="text-[9px] text-[var(--text-muted)] mt-0.5">{btn.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {inputs.lumpyEvents.length === 0 && <p className="text-center text-xs text-[var(--text-muted)] py-4">No events added yet.</p>}

              {inputs.lumpyEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold border", event.amount >= 0 ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20")}>
                        {event.amount >= 0 ? "INFLOW" : "OUTFLOW"}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold border", event.taxType === 'ltcg' ? "bg-teal-400/10 text-teal-400 border-teal-400/20" : event.taxType === 'ordinary' ? "bg-amber-400/10 text-amber-400 border-amber-400/20" : "bg-slate-400/10 text-slate-400 border-slate-400/20")}>
                        {event.taxType === 'ltcg' ? 'LTCG' : event.taxType === 'ordinary' ? 'ORDINARY' : 'NO TAX'}
                      </span>
                    </div>
                    <button onClick={() => removeLumpyEvent(event.id)} className="text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded p-1 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <Input value={event.label} onChange={(e) => updateLumpyEvent({ ...event, label: e.target.value })} className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Age</label>
                      <Input type="number" value={event.year} min={inputs.currentAge} max={inputs.planningAge} onChange={(e) => updateLumpyEvent({ ...event, year: Number(e.target.value) })} className="h-8 text-xs" />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Amount</label>
                      <div className="relative">
                        <span className={cn("absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold", event.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>{event.amount >= 0 ? "+$" : "-$"}</span>
                        <Input type="number" value={Math.abs(event.amount)} onChange={(e) => { const val = Number(e.target.value); const sign = event.amount >= 0 ? 1 : -1; updateLumpyEvent({ ...event, amount: val * sign }); }} className={cn("h-8 pl-7 text-xs font-semibold", event.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Confidence</label>
                      <div className="flex gap-1">
                        {([{ k: 'low', l: '40%' }, { k: 'medium', l: '70%' }, { k: 'high', l: '90%' }] as const).map(c => (
                          <button key={c.k} onClick={() => updateLumpyEvent({ ...event, confidence: c.k, probability: c.k === 'low' ? 0.4 : c.k === 'high' ? 0.9 : 0.7 })} className={cn("flex-1 rounded py-1 text-[9px] font-bold transition-colors", event.confidence === c.k ? "bg-[var(--accent)] text-white" : "bg-white/10 text-[var(--text-muted)]")}>{c.l}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Tax Type</label>
                      <select value={event.taxType} onChange={(e) => updateLumpyEvent({ ...event, taxType: e.target.value as any })} className="h-8 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-2 text-[10px] text-[var(--text-primary)]">
                        <option value="none">No Tax</option>
                        <option value="ltcg">LTCG (~24%)</option>
                        <option value="ordinary">Ordinary (~37%)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={() => addLumpyEvent({ id: Math.random().toString(36).substr(2, 9), label: "Custom Event", year: inputs.currentAge + 5, amount: 0, probability: 1, taxType: "none", confidence: "medium" })} variant="secondary" className="w-full text-xs border-dashed"><Plus size={14} className="mr-2" /> Add Event</Button>
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

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
