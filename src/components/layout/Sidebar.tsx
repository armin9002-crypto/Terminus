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
import { PRESETS, Preset } from "../../config/presets";
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
          <AccordionItem value="you" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 card-noise">
          <AccordionTrigger>You & Your Spouse <Chip>Retire {inputs.retirementAge}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <AgeInput label="Your current age" value={inputs.currentAge} min={30} max={70} error={errors.currentAge} onChange={(value) => setInput("currentAge", value)} />
            <AgeInput label="Your retirement age" value={inputs.retirementAge} min={40} max={75} error={errors.retirementAge} onChange={(value) => setInput("retirementAge", value)} />
            <AgeInput label="Live to age" value={inputs.planningAge} min={75} max={100} error={errors.planningAge} onChange={(value) => setInput("planningAge", value)} />
            <div className="flex items-center justify-between rounded-md border border-border bg-white/[0.03] p-3">
              <span className="text-sm font-medium text-primaryText">Include spouse?</span>
              <Switch checked={inputs.hasSpouse} onCheckedChange={(checked) => setInput("hasSpouse", checked)} />
            </div>
            {inputs.hasSpouse ? (
              <>
                <AgeInput label="Spouse current age" value={inputs.spouseCurrentAge} min={30} max={70} onChange={(value) => setInput("spouseCurrentAge", value)} />
                <AgeInput label="Spouse retirement age" value={inputs.spouseRetirementAge} min={40} max={75} onChange={(value) => setInput("spouseRetirementAge", value)} />
              </>
            ) : null}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="assets" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Your Assets <Chip>{formatCompactCurrency(investable)} investable</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Liquid Assets: taxable brokerage" value={inputs.taxableAssets} error={errors.taxableAssets} onChange={(value) => setInput("taxableAssets", value)} />
            <CurrencyInput label="Tax-Deferred: 401k / IRA" value={inputs.taxDeferredAssets} error={errors.taxDeferredAssets} onChange={(value) => setInput("taxDeferredAssets", value)} />
            <CurrencyInput label="Tax-Free: Roth IRA" value={inputs.taxFreeAssets} error={errors.taxFreeAssets} onChange={(value) => setInput("taxFreeAssets", value)} />
            <Tooltip>
              <TooltipTrigger asChild>
                <div><CurrencyInput label="Illiquid Assets: PE, real estate, carry" value={inputs.illiquidAssets} error={errors.illiquidAssets} onChange={(value) => setInput("illiquidAssets", value)} /></div>
              </TooltipTrigger>
              <TooltipContent className="rounded-md border border-border bg-[#1e293b] p-3 text-sm text-primaryText">Illiquid assets are excluded from the investable base but shown in your net worth snapshot.</TooltipContent>
            </Tooltip>
            <CurrencyInput label="Cash / Emergency Fund" value={inputs.cashReserves} max={2_000_000} error={errors.cashReserves} onChange={(value) => setInput("cashReserves", value)} />
            <div className="grid gap-2 rounded-lg border border-border bg-[#111827] p-3">
              <p className="text-lg font-bold text-primaryText">Total Net Worth: {formatCompactCurrency(gross - inputs.mortgageBalance)}</p>
              <p className="text-sm font-semibold text-teal-200">Investable: {formatCompactCurrency(investable)} ({liquidPct.toFixed(0)}% liquid)</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spending" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Spending Plan <Chip>{formatCompactCurrency(inputs.spendingGoGo)} / yr</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Annual spending - go-go years" value={inputs.spendingGoGo} min={50_000} max={500_000} error={errors.spendingGoGo} onChange={(value) => setInput("spendingGoGo", value)} />
            <CurrencyInput label="Annual spending - slow-go years" value={inputs.spendingSlowGo} min={0} max={500_000} error={errors.spendingSlowGo} onChange={(value) => setInput("spendingSlowGo", value)} />
            <CurrencyInput label="Annual spending - no-go years" value={inputs.spendingNoGo} min={0} max={500_000} error={errors.spendingNoGo} onChange={(value) => setInput("spendingNoGo", value)} />
            <CurrencyInput label="Healthcare surge" value={inputs.healthcareSurgeAmount} max={60_000} step={2_500} error={errors.healthcareSurgeAmount} onChange={(value) => setInput("healthcareSurgeAmount", value)} />
            <SliderInput label="Go-go phase length" value={inputs.goGoYears} min={5} max={15} step={1} onChange={(value) => setInput("goGoYears", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="income" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Income & Social Security <Chip>SS {inputs.socialSecurityAge}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Your Social Security annual benefit" value={inputs.socialSecurityAmount} max={100_000} step={1_000} error={errors.socialSecurityAmount} onChange={(value) => setInput("socialSecurityAmount", value)} />
            <SliderInput label="Your SS claiming age" value={inputs.socialSecurityAge} min={62} max={70} step={1} onChange={(value) => setInput("socialSecurityAge", value)} />
            {inputs.hasSpouse ? (
              <>
                <CurrencyInput label="Spouse SS annual benefit" value={inputs.spouseSocialSecurityAmount} max={100_000} step={1_000} error={errors.spouseSocialSecurityAmount} onChange={(value) => setInput("spouseSocialSecurityAmount", value)} />
                <SliderInput label="Spouse SS claiming age" value={inputs.spouseSocialSecurityAge} min={62} max={70} step={1} onChange={(value) => setInput("spouseSocialSecurityAge", value)} />
              </>
            ) : null}
            <CurrencyInput label="Other annual retirement income" value={inputs.otherRetirementIncome} max={500_000} step={5_000} error={errors.otherRetirementIncome} onChange={(value) => setInput("otherRetirementIncome", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="market" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Market Assumptions <Chip>{(inputs.expectedReturn * 100).toFixed(1)}%</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Expected annual return" value={inputs.expectedReturn} min={0.03} max={0.12} step={0.005} format="percent" error={errors.expectedReturn} onChange={(value) => setInput("expectedReturn", value)} />
            <SliderInput label="Annual volatility" value={inputs.volatility} min={0.05} max={0.3} step={0.005} format="percent" error={errors.volatility} onChange={(value) => setInput("volatility", value)} />
            <SliderInput label="Inflation rate" value={inputs.inflationRate} min={0.01} max={0.06} step={0.0025} format="percent" error={errors.inflationRate} onChange={(value) => setInput("inflationRate", value)} />
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-mutedText">
              Number of simulations
              <select className="h-10 rounded-md border border-border bg-[#101522] px-3 text-sm text-primaryText" value={inputs.numSimulations} onChange={(event) => setInput("numSimulations", Number(event.target.value))}>
                {[500, 1000, 2500, 5000].map((value) => <option key={value} value={value}>{value.toLocaleString()}</option>)}
              </select>
            </label>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="events" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Income Events <Chip>{inputs.lumpyEvents.length}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-3">
            {inputs.lumpyEvents.map((event) => (
              <div key={event.id} className="grid gap-2 rounded-lg border border-border bg-white/[0.03] p-3">
                <Input value={event.label} onChange={(e) => updateLumpyEvent({ ...event, label: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={event.year} onChange={(e) => updateLumpyEvent({ ...event, year: Number(e.target.value) })} />
                  <Input type="number" value={event.amount} onChange={(e) => updateLumpyEvent({ ...event, amount: Number(e.target.value) })} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high"] as const).map((confidence) => (
                    <Button key={confidence} variant={event.confidence === confidence ? "primary" : "secondary"} onClick={() => updateLumpyEvent({ ...event, confidence, probability: confidenceToProbability(confidence) })}>{confidence}</Button>
                  ))}
                  <Button variant="ghost" className="ml-auto" onClick={() => removeLumpyEvent(event.id)}><Trash2 size={15} /></Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addLumpyEvent({ id: crypto.randomUUID(), label: "New event", year: inputs.currentAge + 5, amount: 250_000, probability: 0.7, taxType: "none", confidence: "medium" })}>Add Event</Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="college" className="rounded-lg border border-border px-3">
          <AccordionTrigger>College & Kids <Chip>{inputs.numKids}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Number of children" value={inputs.numKids} min={0} max={4} step={1} onChange={(value) => setInput("numKids", value)} />
            {inputs.collegeEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border bg-white/[0.03] p-3 text-sm text-mutedText">
                {event.childName}: starts at age {event.startYear}, {formatCompactCurrency(event.annualCost)} for {event.years} years, 529 balance {formatCompactCurrency(event.existingSavings529)}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="liabilities" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Liabilities <Chip>{formatCompactCurrency(inputs.mortgageBalance)}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3_000_000} error={errors.mortgageBalance} onChange={(value) => setInput("mortgageBalance", value)} />
            <CurrencyInput label="Annual payment" value={inputs.mortgageAnnualPayment} max={250_000} step={5_000} error={errors.mortgageAnnualPayment} onChange={(value) => setInput("mortgageAnnualPayment", value)} />
            <SliderInput label="Years remaining" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} onChange={(value) => setInput("mortgageYearsRemaining", value)} />
            <CurrencyInput label="Other annual obligations" value={inputs.capitalCallObligations} max={500_000} step={10_000} error={errors.capitalCallObligations} onChange={(value) => setInput("capitalCallObligations", value)} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </aside>
  );
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
          <AccordionItem value="you" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 card-noise">
          <AccordionTrigger>You & Your Spouse <Chip>Retire {inputs.retirementAge}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <AgeInput label="Your current age" value={inputs.currentAge} min={30} max={70} error={errors.currentAge} onChange={(value) => setInput("currentAge", value)} />
            <AgeInput label="Your retirement age" value={inputs.retirementAge} min={40} max={75} error={errors.retirementAge} onChange={(value) => setInput("retirementAge", value)} />
            <AgeInput label="Live to age" value={inputs.planningAge} min={75} max={100} error={errors.planningAge} onChange={(value) => setInput("planningAge", value)} />
            <div className="flex items-center justify-between rounded-md border border-border bg-white/[0.03] p-3">
              <span className="text-sm font-medium text-primaryText">Include spouse?</span>
              <Switch checked={inputs.hasSpouse} onCheckedChange={(checked) => setInput("hasSpouse", checked)} />
            </div>
            {inputs.hasSpouse ? (
              <>
                <AgeInput label="Spouse current age" value={inputs.spouseCurrentAge} min={30} max={70} onChange={(value) => setInput("spouseCurrentAge", value)} />
                <AgeInput label="Spouse retirement age" value={inputs.spouseRetirementAge} min={40} max={75} onChange={(value) => setInput("spouseRetirementAge", value)} />
              </>
            ) : null}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="assets" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Your Assets <Chip>{formatCompactCurrency(investable)} investable</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Liquid Assets: taxable brokerage" value={inputs.taxableAssets} error={errors.taxableAssets} onChange={(value) => setInput("taxableAssets", value)} />
            <CurrencyInput label="Tax-Deferred: 401k / IRA" value={inputs.taxDeferredAssets} error={errors.taxDeferredAssets} onChange={(value) => setInput("taxDeferredAssets", value)} />
            <CurrencyInput label="Tax-Free: Roth IRA" value={inputs.taxFreeAssets} error={errors.taxFreeAssets} onChange={(value) => setInput("taxFreeAssets", value)} />
            <Tooltip>
              <TooltipTrigger asChild>
                <div><CurrencyInput label="Illiquid Assets: PE, real estate, carry" value={inputs.illiquidAssets} error={errors.illiquidAssets} onChange={(value) => setInput("illiquidAssets", value)} /></div>
              </TooltipTrigger>
              <TooltipContent className="rounded-md border border-border bg-[#1e293b] p-3 text-sm text-primaryText">Illiquid assets are excluded from the investable base but shown in your net worth snapshot.</TooltipContent>
            </Tooltip>
            <CurrencyInput label="Cash / Emergency Fund" value={inputs.cashReserves} max={2_000_000} error={errors.cashReserves} onChange={(value) => setInput("cashReserves", value)} />
            <div className="grid gap-2 rounded-lg border border-border bg-[#111827] p-3">
              <p className="text-lg font-bold text-primaryText">Total Net Worth: {formatCompactCurrency(gross - inputs.mortgageBalance)}</p>
              <p className="text-sm font-semibold text-teal-200">Investable: {formatCompactCurrency(investable)} ({liquidPct.toFixed(0)}% liquid)</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spending" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Spending Plan <Chip>{formatCompactCurrency(inputs.spendingGoGo)} / yr</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Annual spending - go-go years" value={inputs.spendingGoGo} min={50_000} max={500_000} error={errors.spendingGoGo} onChange={(value) => setInput("spendingGoGo", value)} />
            <CurrencyInput label="Annual spending - slow-go years" value={inputs.spendingSlowGo} min={0} max={500_000} error={errors.spendingSlowGo} onChange={(value) => setInput("spendingSlowGo", value)} />
            <CurrencyInput label="Annual spending - no-go years" value={inputs.spendingNoGo} min={0} max={500_000} error={errors.spendingNoGo} onChange={(value) => setInput("spendingNoGo", value)} />
            <CurrencyInput label="Healthcare surge" value={inputs.healthcareSurgeAmount} max={60_000} step={2_500} error={errors.healthcareSurgeAmount} onChange={(value) => setInput("healthcareSurgeAmount", value)} />
            <SliderInput label="Go-go phase length" value={inputs.goGoYears} min={5} max={15} step={1} onChange={(value) => setInput("goGoYears", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="income" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Income & Social Security <Chip>SS {inputs.socialSecurityAge}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Your Social Security annual benefit" value={inputs.socialSecurityAmount} max={100_000} step={1_000} error={errors.socialSecurityAmount} onChange={(value) => setInput("socialSecurityAmount", value)} />
            <SliderInput label="Your SS claiming age" value={inputs.socialSecurityAge} min={62} max={70} step={1} onChange={(value) => setInput("socialSecurityAge", value)} />
            {inputs.hasSpouse ? (
              <>
                <CurrencyInput label="Spouse SS annual benefit" value={inputs.spouseSocialSecurityAmount} max={100_000} step={1_000} error={errors.spouseSocialSecurityAmount} onChange={(value) => setInput("spouseSocialSecurityAmount", value)} />
                <SliderInput label="Spouse SS claiming age" value={inputs.spouseSocialSecurityAge} min={62} max={70} step={1} onChange={(value) => setInput("spouseSocialSecurityAge", value)} />
              </>
            ) : null}
            <CurrencyInput label="Other annual retirement income" value={inputs.otherRetirementIncome} max={500_000} step={5_000} error={errors.otherRetirementIncome} onChange={(value) => setInput("otherRetirementIncome", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="market" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Market Assumptions <Chip>{(inputs.expectedReturn * 100).toFixed(1)}%</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Expected annual return" value={inputs.expectedReturn} min={0.03} max={0.12} step={0.005} format="percent" error={errors.expectedReturn} onChange={(value) => setInput("expectedReturn", value)} />
            <SliderInput label="Annual volatility" value={inputs.volatility} min={0.05} max={0.3} step={0.005} format="percent" error={errors.volatility} onChange={(value) => setInput("volatility", value)} />
            <SliderInput label="Inflation rate" value={inputs.inflationRate} min={0.01} max={0.06} step={0.0025} format="percent" error={errors.inflationRate} onChange={(value) => setInput("inflationRate", value)} />
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-mutedText">
              Number of simulations
              <select className="h-10 rounded-md border border-border bg-[#101522] px-3 text-sm text-primaryText" value={inputs.numSimulations} onChange={(event) => setInput("numSimulations", Number(event.target.value))}>
                {[500, 1000, 2500, 5000].map((value) => <option key={value} value={value}>{value.toLocaleString()}</option>)}
              </select>
            </label>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="events" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Income Events <Chip>{inputs.lumpyEvents.length}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-3">
            {inputs.lumpyEvents.map((event) => (
              <div key={event.id} className="grid gap-2 rounded-lg border border-border bg-white/[0.03] p-3">
                <Input value={event.label} onChange={(e) => updateLumpyEvent({ ...event, label: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={event.year} onChange={(e) => updateLumpyEvent({ ...event, year: Number(e.target.value) })} />
                  <Input type="number" value={event.amount} onChange={(e) => updateLumpyEvent({ ...event, amount: Number(e.target.value) })} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high"] as const).map((confidence) => (
                    <Button key={confidence} variant={event.confidence === confidence ? "primary" : "secondary"} onClick={() => updateLumpyEvent({ ...event, confidence, probability: confidenceToProbability(confidence) })}>{confidence}</Button>
                  ))}
                  <Button variant="ghost" className="ml-auto" onClick={() => removeLumpyEvent(event.id)}><Trash2 size={15} /></Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addLumpyEvent({ id: crypto.randomUUID(), label: "New event", year: inputs.currentAge + 5, amount: 250_000, probability: 0.7, taxType: "none", confidence: "medium" })}>Add Event</Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="college" className="rounded-lg border border-border px-3">
          <AccordionTrigger>College & Kids <Chip>{inputs.numKids}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Number of children" value={inputs.numKids} min={0} max={4} step={1} onChange={(value) => setInput("numKids", value)} />
            {inputs.collegeEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border bg-white/[0.03] p-3 text-sm text-mutedText">
                {event.childName}: starts at age {event.startYear}, {formatCompactCurrency(event.annualCost)} for {event.years} years, 529 balance {formatCompactCurrency(event.existingSavings529)}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="liabilities" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Liabilities <Chip>{formatCompactCurrency(inputs.mortgageBalance)}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3_000_000} error={errors.mortgageBalance} onChange={(value) => setInput("mortgageBalance", value)} />
            <CurrencyInput label="Annual payment" value={inputs.mortgageAnnualPayment} max={250_000} step={5_000} error={errors.mortgageAnnualPayment} onChange={(value) => setInput("mortgageAnnualPayment", value)} />
            <SliderInput label="Years remaining" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} onChange={(value) => setInput("mortgageYearsRemaining", value)} />
            <CurrencyInput label="Other annual obligations" value={inputs.capitalCallObligations} max={500_000} step={10_000} error={errors.capitalCallObligations} onChange={(value) => setInput("capitalCallObligations", value)} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </aside>
  );
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
          <AccordionItem value="you" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 card-noise">
          <AccordionTrigger>You & Your Spouse <Chip>Retire {inputs.retirementAge}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <AgeInput label="Your current age" value={inputs.currentAge} min={30} max={70} error={errors.currentAge} onChange={(value) => setInput("currentAge", value)} />
            <AgeInput label="Your retirement age" value={inputs.retirementAge} min={40} max={75} error={errors.retirementAge} onChange={(value) => setInput("retirementAge", value)} />
            <AgeInput label="Live to age" value={inputs.planningAge} min={75} max={100} error={errors.planningAge} onChange={(value) => setInput("planningAge", value)} />
            <div className="flex items-center justify-between rounded-md border border-border bg-white/[0.03] p-3">
              <span className="text-sm font-medium text-primaryText">Include spouse?</span>
              <Switch checked={inputs.hasSpouse} onCheckedChange={(checked) => setInput("hasSpouse", checked)} />
            </div>
            {inputs.hasSpouse ? (
              <>
                <AgeInput label="Spouse current age" value={inputs.spouseCurrentAge} min={30} max={70} onChange={(value) => setInput("spouseCurrentAge", value)} />
                <AgeInput label="Spouse retirement age" value={inputs.spouseRetirementAge} min={40} max={75} onChange={(value) => setInput("spouseRetirementAge", value)} />
              </>
            ) : null}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="assets" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Your Assets <Chip>{formatCompactCurrency(investable)} investable</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Liquid Assets: taxable brokerage" value={inputs.taxableAssets} error={errors.taxableAssets} onChange={(value) => setInput("taxableAssets", value)} />
            <CurrencyInput label="Tax-Deferred: 401k / IRA" value={inputs.taxDeferredAssets} error={errors.taxDeferredAssets} onChange={(value) => setInput("taxDeferredAssets", value)} />
            <CurrencyInput label="Tax-Free: Roth IRA" value={inputs.taxFreeAssets} error={errors.taxFreeAssets} onChange={(value) => setInput("taxFreeAssets", value)} />
            <Tooltip>
              <TooltipTrigger asChild>
                <div><CurrencyInput label="Illiquid Assets: PE, real estate, carry" value={inputs.illiquidAssets} error={errors.illiquidAssets} onChange={(value) => setInput("illiquidAssets", value)} /></div>
              </TooltipTrigger>
              <TooltipContent className="rounded-md border border-border bg-[#1e293b] p-3 text-sm text-primaryText">Illiquid assets are excluded from the investable base but shown in your net worth snapshot.</TooltipContent>
            </Tooltip>
            <CurrencyInput label="Cash / Emergency Fund" value={inputs.cashReserves} max={2_000_000} error={errors.cashReserves} onChange={(value) => setInput("cashReserves", value)} />
            <div className="grid gap-2 rounded-lg border border-border bg-[#111827] p-3">
              <p className="text-lg font-bold text-primaryText">Total Net Worth: {formatCompactCurrency(gross - inputs.mortgageBalance)}</p>
              <p className="text-sm font-semibold text-teal-200">Investable: {formatCompactCurrency(investable)} ({liquidPct.toFixed(0)}% liquid)</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spending" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Spending Plan <Chip>{formatCompactCurrency(inputs.spendingGoGo)} / yr</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Annual spending - go-go years" value={inputs.spendingGoGo} min={50_000} max={500_000} error={errors.spendingGoGo} onChange={(value) => setInput("spendingGoGo", value)} />
            <CurrencyInput label="Annual spending - slow-go years" value={inputs.spendingSlowGo} min={0} max={500_000} error={errors.spendingSlowGo} onChange={(value) => setInput("spendingSlowGo", value)} />
            <CurrencyInput label="Annual spending - no-go years" value={inputs.spendingNoGo} min={0} max={500_000} error={errors.spendingNoGo} onChange={(value) => setInput("spendingNoGo", value)} />
            <CurrencyInput label="Healthcare surge" value={inputs.healthcareSurgeAmount} max={60_000} step={2_500} error={errors.healthcareSurgeAmount} onChange={(value) => setInput("healthcareSurgeAmount", value)} />
            <SliderInput label="Go-go phase length" value={inputs.goGoYears} min={5} max={15} step={1} onChange={(value) => setInput("goGoYears", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="income" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Income & Social Security <Chip>SS {inputs.socialSecurityAge}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Your Social Security annual benefit" value={inputs.socialSecurityAmount} max={100_000} step={1_000} error={errors.socialSecurityAmount} onChange={(value) => setInput("socialSecurityAmount", value)} />
            <SliderInput label="Your SS claiming age" value={inputs.socialSecurityAge} min={62} max={70} step={1} onChange={(value) => setInput("socialSecurityAge", value)} />
            {inputs.hasSpouse ? (
              <>
                <CurrencyInput label="Spouse SS annual benefit" value={inputs.spouseSocialSecurityAmount} max={100_000} step={1_000} error={errors.spouseSocialSecurityAmount} onChange={(value) => setInput("spouseSocialSecurityAmount", value)} />
                <SliderInput label="Spouse SS claiming age" value={inputs.spouseSocialSecurityAge} min={62} max={70} step={1} onChange={(value) => setInput("spouseSocialSecurityAge", value)} />
              </>
            ) : null}
            <CurrencyInput label="Other annual retirement income" value={inputs.otherRetirementIncome} max={500_000} step={5_000} error={errors.otherRetirementIncome} onChange={(value) => setInput("otherRetirementIncome", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="market" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Market Assumptions <Chip>{(inputs.expectedReturn * 100).toFixed(1)}%</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Expected annual return" value={inputs.expectedReturn} min={0.03} max={0.12} step={0.005} format="percent" error={errors.expectedReturn} onChange={(value) => setInput("expectedReturn", value)} />
            <SliderInput label="Annual volatility" value={inputs.volatility} min={0.05} max={0.3} step={0.005} format="percent" error={errors.volatility} onChange={(value) => setInput("volatility", value)} />
            <SliderInput label="Inflation rate" value={inputs.inflationRate} min={0.01} max={0.06} step={0.0025} format="percent" error={errors.inflationRate} onChange={(value) => setInput("inflationRate", value)} />
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-mutedText">
              Number of simulations
              <select className="h-10 rounded-md border border-border bg-[#101522] px-3 text-sm text-primaryText" value={inputs.numSimulations} onChange={(event) => setInput("numSimulations", Number(event.target.value))}>
                {[500, 1000, 2500, 5000].map((value) => <option key={value} value={value}>{value.toLocaleString()}</option>)}
              </select>
            </label>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="events" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Income Events <Chip>{inputs.lumpyEvents.length}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-3">
            {inputs.lumpyEvents.map((event) => (
              <div key={event.id} className="grid gap-2 rounded-lg border border-border bg-white/[0.03] p-3">
                <Input value={event.label} onChange={(e) => updateLumpyEvent({ ...event, label: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={event.year} onChange={(e) => updateLumpyEvent({ ...event, year: Number(e.target.value) })} />
                  <Input type="number" value={event.amount} onChange={(e) => updateLumpyEvent({ ...event, amount: Number(e.target.value) })} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high"] as const).map((confidence) => (
                    <Button key={confidence} variant={event.confidence === confidence ? "primary" : "secondary"} onClick={() => updateLumpyEvent({ ...event, confidence, probability: confidenceToProbability(confidence) })}>{confidence}</Button>
                  ))}
                  <Button variant="ghost" className="ml-auto" onClick={() => removeLumpyEvent(event.id)}><Trash2 size={15} /></Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={() => addLumpyEvent({ id: crypto.randomUUID(), label: "New event", year: inputs.currentAge + 5, amount: 250_000, probability: 0.7, taxType: "none", confidence: "medium" })}>Add Event</Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="college" className="rounded-lg border border-border px-3">
          <AccordionTrigger>College & Kids <Chip>{inputs.numKids}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Number of children" value={inputs.numKids} min={0} max={4} step={1} onChange={(value) => setInput("numKids", value)} />
            {inputs.collegeEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border bg-white/[0.03] p-3 text-sm text-mutedText">
                {event.childName}: starts at age {event.startYear}, {formatCompactCurrency(event.annualCost)} for {event.years} years, 529 balance {formatCompactCurrency(event.existingSavings529)}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="liabilities" className="rounded-lg border border-border px-3">
          <AccordionTrigger>Liabilities <Chip>{formatCompactCurrency(inputs.mortgageBalance)}</Chip></AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3_000_000} error={errors.mortgageBalance} onChange={(value) => setInput("mortgageBalance", value)} />
            <CurrencyInput label="Annual payment" value={inputs.mortgageAnnualPayment} max={250_000} step={5_000} error={errors.mortgageAnnualPayment} onChange={(value) => setInput("mortgageAnnualPayment", value)} />
            <SliderInput label="Years remaining" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} onChange={(value) => setInput("mortgageYearsRemaining", value)} />
            <CurrencyInput label="Other annual obligations" value={inputs.capitalCallObligations} max={500_000} step={10_000} error={errors.capitalCallObligations} onChange={(value) => setInput("capitalCallObligations", value)} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>
    </aside>
  );
}
