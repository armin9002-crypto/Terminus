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
            <AccordionTrigger>Spending <Chip>{formatCompactCurrency(inputs.spendingGoGo)}/yr</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <SliderInput label="Go-Go Spending" value={inputs.spendingGoGo} min={50000} max={500000} step={5000} format="currency" onChange={(v) => setInput("spendingGoGo", v)} />
              <SliderInput label="Inflation Rate" value={inputs.inflationRate} min={0} max={0.1} step={0.001} format="percent" onChange={(v) => setInput("inflationRate", v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="market" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>Market <Chip>{(inputs.expectedReturn * 100).toFixed(1)}% Return</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-4">
              <SliderInput label="Expected Return" value={inputs.expectedReturn} min={0.01} max={0.15} step={0.005} format="percent" onChange={(v) => setInput("expectedReturn", v)} />
              <SliderInput label="Volatility" value={inputs.volatility} min={0.01} max={0.3} step={0.01} format="percent" onChange={(v) => setInput("volatility", v)} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="events" className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4">
            <AccordionTrigger>Lumpy Events <Chip>{inputs.lumpyEvents.length}</Chip></AccordionTrigger>
            <AccordionContent className="grid gap-3">
              {inputs.lumpyEvents.map((event) => (
                <div key={event.id} className="grid gap-2 rounded-lg border border-[var(--border)] bg-white/[0.03] p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">{event.label}</span>
                    <Button variant="ghost" className="h-6 w-6 p-0" onClick={() => removeLumpyEvent(event.id)}>
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={event.label} onChange={(e) => updateLumpyEvent({ ...event, label: e.target.value })} className="h-8 text-xs" />
                    <Input type="number" value={event.year} onChange={(e) => updateLumpyEvent({ ...event, year: Number(e.target.value) })} className="h-8 w-20 text-xs" />
                  </div>
                </div>
              ))}
              <Button 
                variant="secondary" 
                className="w-full text-xs"
                onClick={() => addLumpyEvent({ 
                  id: Math.random().toString(36).substr(2, 9), 
                  label: "New Event", 
                  year: inputs.currentAge + 5, 
                  amount: 100000, 
                  probability: 1, 
                  taxType: "none", 
                  confidence: "medium" 
                })}
              >
                + Add Event
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Net Worth</p>
            <p className="text-lg font-bold"><AnimatedNumber value={totalNW} format="currency" /></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Liquidity</p>
            <p className="text-lg font-bold text-[var(--accent)]">{liquidPct.toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
}
