import { Controller, useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AgeInput } from "@/components/inputs/AgeInput";
import { CurrencyInput } from "@/components/inputs/CurrencyInput";
import { SliderInput } from "@/components/inputs/SliderInput";
import { SpousePanel } from "@/components/inputs/SpousePanel";
import { IncomeEventRow } from "@/components/inputs/IncomeEventRow";
import { LumpyEventModal } from "@/components/modals/LumpyEventModal";
import { useSimStore } from "@/store/useSimStore";
import { formatCompactCurrency } from "@/lib/formatters";
import type { SimInputs } from "@/types";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-white/[0.04] px-2 py-1 text-[11px] text-mutedText">{children}</span>;
}

export function Sidebar() {
  const inputs = useSimStore((state) => state.inputs);
  const setInput = useSimStore((state) => state.setInput);
  const removeLumpyEvent = useSimStore((state) => state.removeLumpyEvent);
  const { control } = useForm<SimInputs>({ values: inputs });
  const totalAssets =
    inputs.taxableAssets + inputs.taxDeferredAssets + inputs.taxFreeAssets + inputs.illiquidAssets + inputs.cashReserves;

  const numberField = <K extends keyof SimInputs>(name: K, onChange?: (value: number) => void) => ({
    name,
    control,
    render: ({ field }: { field: { value: SimInputs[K]; onChange: (value: SimInputs[K]) => void } }) => {
      const update = (value: number) => {
        field.onChange(value as SimInputs[K]);
        setInput(name, value as SimInputs[K]);
        onChange?.(value);
      };
      return { value: Number(field.value), update };
    },
  });

  return (
    <aside className="h-[calc(100vh-76px)] overflow-y-auto border-r border-border bg-sidebar p-4 lg:sticky lg:top-[76px]">
      <Accordion type="multiple" defaultValue={["ages", "assets", "spending", "market"]} className="grid gap-2">
        <AccordionItem value="ages" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Personal & Retirement Ages <Chip>Retire {inputs.retirementAge}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <Controller
              {...numberField("currentAge")}
              render={({ field }) => (
                <AgeInput label="Current age" value={Number(field.value)} onChange={(value) => setInput("currentAge", value)} />
              )}
            />
            <Controller
              {...numberField("retirementAge")}
              render={({ field }) => (
                <AgeInput label="Retirement age" value={Number(field.value)} onChange={(value) => setInput("retirementAge", value)} />
              )}
            />
            <Controller
              {...numberField("planningAge")}
              render={({ field }) => (
                <AgeInput label="Planning age" value={Number(field.value)} max={110} onChange={(value) => setInput("planningAge", value)} />
              )}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="assets" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Asset Buckets <Chip>Total {formatCompactCurrency(totalAssets)}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Taxable brokerage" value={inputs.taxableAssets} onChange={(value) => setInput("taxableAssets", value)} />
            <CurrencyInput label="Tax deferred" value={inputs.taxDeferredAssets} onChange={(value) => setInput("taxDeferredAssets", value)} />
            <CurrencyInput label="Tax free Roth" value={inputs.taxFreeAssets} onChange={(value) => setInput("taxFreeAssets", value)} />
            <CurrencyInput label="Illiquid assets" value={inputs.illiquidAssets} onChange={(value) => setInput("illiquidAssets", value)} />
            <CurrencyInput label="Cash reserves" value={inputs.cashReserves} max={2_000_000} onChange={(value) => setInput("cashReserves", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spouse" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Spouse <Chip>{inputs.hasSpouse ? "Enabled" : "Off"}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-white/[0.03] p-3">
              <span className="text-sm font-medium text-primaryText">Include spouse</span>
              <Switch checked={inputs.hasSpouse} onCheckedChange={(checked) => setInput("hasSpouse", checked)} />
            </div>
            <SpousePanel
              hasSpouse={inputs.hasSpouse}
              spouseCurrentAge={inputs.spouseCurrentAge}
              spouseRetirementAge={inputs.spouseRetirementAge}
              spousePlanningAge={inputs.spousePlanningAge}
              spouseAnnualSalary={inputs.spouseAnnualSalary}
              onChange={(key, value) => setInput(key, value)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="income" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Income & Social Security <Chip>{formatCompactCurrency(inputs.annualSalary)}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Annual salary" value={inputs.annualSalary} max={2_000_000} onChange={(value) => setInput("annualSalary", value)} />
            <AgeInput label="Social Security age" value={inputs.socialSecurityAge} min={62} max={75} onChange={(value) => setInput("socialSecurityAge", value)} />
            <CurrencyInput label="Social Security annual" value={inputs.socialSecurityAmount} max={100_000} step={1_000} onChange={(value) => setInput("socialSecurityAmount", value)} />
            <AgeInput label="Spouse SS age" value={inputs.spouseSocialSecurityAge} min={62} max={75} onChange={(value) => setInput("spouseSocialSecurityAge", value)} />
            <CurrencyInput label="Spouse SS annual" value={inputs.spouseSocialSecurityAmount} max={100_000} step={1_000} onChange={(value) => setInput("spouseSocialSecurityAmount", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spending" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Spending Pattern <Chip>{formatCompactCurrency(inputs.spendingGoGo)}/yr</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Go-go spending" value={inputs.spendingGoGo} max={750_000} onChange={(value) => setInput("spendingGoGo", value)} />
            <CurrencyInput label="Slow-go spending" value={inputs.spendingSlowGo} max={600_000} onChange={(value) => setInput("spendingSlowGo", value)} />
            <CurrencyInput label="No-go spending" value={inputs.spendingNoGo} max={500_000} onChange={(value) => setInput("spendingNoGo", value)} />
            <SliderInput label="Go-go years" value={inputs.goGoYears} min={1} max={20} step={1} onChange={(value) => setInput("goGoYears", value)} />
            <SliderInput label="Slow-go years" value={inputs.slowGoYears} min={1} max={25} step={1} onChange={(value) => setInput("slowGoYears", value)} />
            <CurrencyInput label="Healthcare surge" value={inputs.healthcareSurgeAmount} max={150_000} step={5_000} onChange={(value) => setInput("healthcareSurgeAmount", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="market" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Market Assumptions <Chip>{(inputs.expectedReturn * 100).toFixed(1)}% return</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Expected return" value={inputs.expectedReturn} min={0} max={0.14} step={0.005} format="percent" onChange={(value) => setInput("expectedReturn", value)} />
            <SliderInput label="Volatility" value={inputs.volatility} min={0.02} max={0.35} step={0.005} format="percent" onChange={(value) => setInput("volatility", value)} />
            <SliderInput label="Inflation" value={inputs.inflationRate} min={0} max={0.08} step={0.001} format="percent" onChange={(value) => setInput("inflationRate", value)} />
            <SliderInput label="Simulations" value={inputs.numSimulations} min={100} max={5000} step={100} onChange={(value) => setInput("numSimulations", value)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="events" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Lumpy Income Events <Chip>{inputs.lumpyEvents.length}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-3">
            {inputs.lumpyEvents.map((event) => (
              <IncomeEventRow key={event.id} event={event} onRemove={removeLumpyEvent} />
            ))}
            <LumpyEventModal />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="college" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            College Funding <Chip>{inputs.numKids} kids</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <SliderInput label="Children" value={inputs.numKids} min={0} max={5} step={1} onChange={(value) => setInput("numKids", value)} />
            <Button variant="secondary" className="gap-2">
              <Plus size={15} /> Add college plan
            </Button>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="liabilities" className="rounded-lg border border-border px-3">
          <AccordionTrigger>
            Liabilities <Chip>{formatCompactCurrency(inputs.mortgageBalance)}</Chip>
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <CurrencyInput label="Mortgage balance" value={inputs.mortgageBalance} max={3_000_000} onChange={(value) => setInput("mortgageBalance", value)} />
            <CurrencyInput label="Mortgage payment" value={inputs.mortgageAnnualPayment} max={250_000} step={5_000} onChange={(value) => setInput("mortgageAnnualPayment", value)} />
            <SliderInput label="Mortgage years" value={inputs.mortgageYearsRemaining} min={0} max={30} step={1} onChange={(value) => setInput("mortgageYearsRemaining", value)} />
            <CurrencyInput label="Capital calls" value={inputs.capitalCallObligations} max={500_000} step={10_000} onChange={(value) => setInput("capitalCallObligations", value)} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
