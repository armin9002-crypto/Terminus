import { Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { AgeInput } from "../../components/inputs/AgeInput";
import { CurrencyInput } from "../../components/inputs/CurrencyInput";
import { SliderInput } from "../../components/inputs/SliderInput";
import { getInvestableAssets, getTotalNetWorth } from "../../engine/monteCarlo";
import { formatCompactCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { useSimStore } from "../../store/useSimStore";
import type { LumpyEvent } from "../../types";
import { PRESETS, type Preset } from "./presets";
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
  
  const investable = getInvestableAssets(inputs);
  const totalNW = getTotalNetWorth(inputs);
  const gross = investable + inputs.illiquidAssets;
  const liquidPct = gross > 0 ? (investable / gross) * 100 : 0;

  return (
    <aside className={`${mobile ? "max-h-[85vh]" : "h-[calc(100vh-56px)] lg:sticky lg:top-[56px]"} sidebar-scroll flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]`}>
      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="mb-8">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">Quick Start</h3>
          <div className="grid grid-cols-2 gap-3">
            {PRESETS.map((p: Preset) => (
              <button
                key={p.id}
                onClick={() => setInputs(p.inputs)}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition-all hover:bg-[var(--bg-card-hover)]",
                  JSON.stringify(inputs).slice(0, 100) === JSON.stringify(p.inputs).slice(0, 100) 
                    ? "border-[var(--accent)] bg-[var(--accent-glow)] shadow-[0_0_0_1px_var(--accent)]" 
                    : "border-[var(--border)] bg-[var(--bg-card)]"
                )}
              >
                <span className="text-xl mb-1">{p.emoji}</span>
                <span className="text-[13px] font-bold text-[var(--text-primary)]">{p.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] line-clamp-1">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["you", "assets"]} className="grid gap-3">
          <AccordionItem value="you" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>You & Your Spouse <Chip>Retire {inputs.retirementAge}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-4">
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

          <AccordionItem value="assets" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>Your Assets <Chip>{formatCompactCurrency(investable)} liquid</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <CurrencyInput label="Taxable Brokerage" value={inputs.taxableAssets} onChange={(v) => setInput("taxableAssets", v)} />
              <CurrencyInput label="401k / IRA" value={inputs.taxDeferredAssets} onChange={(v) => setInput("taxDeferredAssets", v)} />
              <CurrencyInput label="Roth IRA" value={inputs.taxFreeAssets} onChange={(v) => setInput("taxFreeAssets", v)} />
              <CurrencyInput label="Illiquid Assets" value={inputs.illiquidAssets} onChange={(v) => setInput("illiquidAssets", v)} />
              <CurrencyInput label="Cash Reserves" value={inputs.cashReserves} onChange={(v) => setInput("cashReserves", v)} />
            </AccordionContent>
          </AccordionItem>

        <AccordionItem value="spending" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
          <AccordionTrigger>
            Spending Plan
            <Chip>{formatCompactCurrency(inputs.spendingGoGo)}/yr</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              The spending smile: high spending in active retirement,
              less in mid-retirement, then healthcare costs rise late.
            </p>
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

        <AccordionItem value="market" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
          <AccordionTrigger>Market <Chip>{(inputs.expectedReturn * 100).toFixed(1)}% Return</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Expected Return" value={inputs.expectedReturn} min={0.01} max={0.15} step={0.005} format="percent" onChange={(v) => setInput("expectedReturn", v)} />
            <SliderInput label="Volatility" value={inputs.volatility} min={0.01} max={0.3} step={0.01} format="percent" onChange={(v) => setInput("volatility", v)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="income" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
          <AccordionTrigger>
            Income & Social Security
            <Chip>SS {inputs.socialSecurityAge}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
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

          <AccordionItem value="events" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>Lumpy Events <Chip>{inputs.lumpyEvents.length}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-3">
              <div className="mb-2">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block mb-2">Quick Fill New Event</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '💰 Carry', type: 'carry' },
                    { label: '🏠 RE Sale', type: 're' },
                    { label: '📈 Bonus', type: 'bonus' },
                    { label: '💸 Cap Call', type: 'call' },
                  ].map(btn => (
                    <button 
                      key={btn.type}
                      onClick={() => {
                        let defaults: any = {};
                        if (btn.type === 'carry') defaults = { label: "Carry Distribution", taxType: "ltcg", amount: 1500000, confidence: "medium", probability: 0.7 };
                        if (btn.type === 're') defaults = { label: "Real Estate Sale", taxType: "ltcg", amount: 500000, confidence: "medium", probability: 0.7 };
                        if (btn.type === 'bonus') defaults = { label: "Annual Bonus", taxType: "ordinary", amount: 200000, confidence: "high", probability: 0.9 };
                        if (btn.type === 'call') defaults = { label: "Capital Call", taxType: "none", amount: -250000, confidence: "high", probability: 1 };
                        
                        addLumpyEvent({
                          id: Math.random().toString(36).substr(2, 9),
                          year: inputs.currentAge + 5,
                          ...defaults
                        });
                      }}
                      className="px-2 py-1 rounded border border-[var(--border)] bg-white/[0.02] text-[10px] hover:bg-[var(--accent)] hover:text-white transition-all"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {inputs.lumpyEvents.map((event) => (
                <div key={event.id} className="grid gap-2.5 rounded-lg border border-[var(--border)] bg-white/[0.03] p-3">
                  {/* Row 1: Label */}
                  <Input 
                    value={event.label} 
                    onChange={(e) => updateLumpyEvent({ ...event, label: e.target.value })} 
                    placeholder="Event label"
                    className="h-8 text-xs w-full" 
                  />
                  
                  {/* Row 2: Age, Amount, Confidence */}
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={event.year} 
                      onChange={(e) => updateLumpyEvent({ ...event, year: Number(e.target.value) })} 
                      className="h-8 text-xs" 
                      style={{ width: '60px' }}
                    />
                    <div className="relative flex-1">
                      <span className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold",
                        event.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                      )}>
                        {event.amount >= 0 ? "+" : "-"}$
                      </span>
                      <Input 
                        type="number" 
                        value={Math.abs(event.amount)} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const sign = event.amount >= 0 ? 1 : -1;
                          updateLumpyEvent({ ...event, amount: val * sign });
                        }} 
                        className={cn(
                          "h-8 pl-6 text-xs font-medium",
                          event.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                        )}
                      />
                    </div>
                    <div className="flex gap-1">
                      {(['low', 'medium', 'high'] as const).map((conf) => (
                        <button
                          key={conf}
                          onClick={() => updateLumpyEvent({ ...event, confidence: conf, probability: confidenceToProbability(conf) })}
                          className={cn(
                            "rounded px-2 py-1 text-[9px] font-bold uppercase transition-colors",
                            event.confidence === conf ? "bg-[var(--accent)] text-white" : "bg-white/10 text-[var(--text-muted)]"
                          )}
                        >
                          {conf.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Row 3: Tax selector, Badge, Delete */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <select 
                        className="h-8 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-2 text-[10px] text-[var(--text-primary)]"
                        value={event.taxType}
                        onChange={(e) => updateLumpyEvent({ ...event, taxType: e.target.value as any })}
                      >
                        <option value="none">No Tax</option>
                        <option value="ordinary">Ordinary</option>
                        <option value="ltcg">LTCG</option>
                      </select>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold border",
                        event.taxType === 'ltcg' ? "bg-teal-400/10 text-teal-400 border-teal-400/20" :
                        event.taxType === 'ordinary' ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                        "bg-slate-400/10 text-slate-400 border-slate-400/20"
                      )}>
                        {event.taxType === 'ltcg' ? 'LTCG' : event.taxType === 'ordinary' ? 'ORD' : 'FREE'}
                      </span>
                    </div>
                    <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-colors" onClick={() => removeLumpyEvent(event.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <Button 
                className="w-full rounded-lg border border-dashed border-[var(--border)] py-2.5 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                onClick={() => addLumpyEvent({ 
                  id: Math.random().toString(36).substr(2, 9), 
                  label: "Custom Event", 
                  year: inputs.currentAge + 5, 
                  amount: 0, 
                  probability: 1, 
                  taxType: "none", 
                  confidence: "medium" 
                })}
              >
                + Add Custom Event
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="liabilities" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>Liabilities & Obligations <Chip>{formatCompactCurrency(inputs.mortgageBalance)}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3000000} onChange={(v) => setInput('mortgageBalance', v)} />
              <CurrencyInput label="Annual mortgage payment" value={inputs.mortgageAnnualPayment} max={250000} step={5000} onChange={(v) => setInput('mortgageAnnualPayment', v)} />
              <SliderInput label="Years remaining on mortgage" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} onChange={(v) => setInput('mortgageYearsRemaining', v)} />
              <CurrencyInput label="Annual capital call obligations" value={inputs.capitalCallObligations} max={500000} step={10000} onChange={(v) => setInput('capitalCallObligations', v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="college" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>
              College & Kids
              <Chip>{inputs.collegeEvents.length} kids</Chip>
            </AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <p className="text-[11px] text-[var(--text-muted)]">
                College costs are modeled as annual withdrawals during the college years, net of 529 savings. Years are your age when college starts.
              </p>
              {inputs.collegeEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-[var(--border)] bg-white/[0.03] p-3 grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{event.childName}</span>
                    <button className="text-[var(--danger)] text-xs" onClick={() => {
                      const updated = inputs.collegeEvents.filter(e => e.id !== event.id);
                      setInput('collegeEvents', updated);
                    }}>Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">Your age at start</span>
                      <input type="number" value={event.startYear} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? {...ev, startYear: Number(e.target.value)} : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">Annual cost</span>
                      <input type="number" value={event.annualCost} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? {...ev, annualCost: Number(e.target.value)} : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">Years (usually 4)</span>
                      <input type="number" value={event.years} min={1} max={6} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? {...ev, years: Number(e.target.value)} : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[var(--text-muted)] uppercase tracking-widest text-[10px]">529 balance</span>
                      <input type="number" value={event.existingSavings529} onChange={e => {
                        const updated = inputs.collegeEvents.map(ev => ev.id === event.id ? {...ev, existingSavings529: Number(e.target.value)} : ev);
                        setInput('collegeEvents', updated);
                      }} className="h-8 rounded border border-[var(--border)] bg-transparent px-2 text-[var(--text-primary)]" />
                    </label>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Total cost: {formatCompactCurrency(Math.max(0, event.annualCost * event.years - event.existingSavings529))} net of 529 savings
                  </p>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newEvent = {
                    id: Math.random().toString(36).substr(2, 9),
                    childName: `Child ${inputs.collegeEvents.length + 1}`,
                    startYear: inputs.currentAge + 18,
                    annualCost: 85000,
                    years: 4,
                    existingSavings529: 100000,
                  };
                  setInput('collegeEvents', [...inputs.collegeEvents, newEvent]);
                }}
                className="w-full rounded-lg border border-dashed border-[var(--border)] py-2 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                + Add Child
              </button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] p-4">
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
