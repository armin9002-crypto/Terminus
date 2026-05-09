import { CheckCircle2, CircleAlert, CircleX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrency, formatPercentage } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SimInputs, SimResults } from "@/types";

interface HeroVerdictProps {
  inputs: SimInputs;
  results: SimResults | null;
}

export function HeroVerdict({ inputs, results }: HeroVerdictProps) {
  const successRate = results?.successRate ?? 0;
  const isStrong = successRate > 0.85;
  const isCaution = successRate >= 0.7 && successRate <= 0.85;
  const Icon = isStrong ? CheckCircle2 : isCaution ? CircleAlert : CircleX;

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-none transition-colors duration-300",
        isStrong && "border-success/30 bg-success/5",
        isCaution && "border-warning/30 bg-warning/5",
        !isStrong && !isCaution && "border-danger/30 bg-danger/5",
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-md border",
                isStrong && "border-success/40 text-success",
                isCaution && "border-warning/40 text-warning",
                !isStrong && !isCaution && "border-danger/40 text-danger",
              )}
            >
              <Icon size={26} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mutedText">Live verdict</p>
              <h1 className="mt-2 max-w-4xl text-2xl font-bold leading-tight text-primaryText md:text-4xl">
                You can sustain {formatCompactCurrency(inputs.spendingGoGo)}/year with{" "}
                {formatPercentage(successRate, 0)} confidence through age {inputs.planningAge}
              </h1>
              <p className="mt-3 text-sm text-mutedText">
                Retire at {inputs.retirementAge} · {formatCompactCurrency(
                  inputs.taxableAssets +
                    inputs.taxDeferredAssets +
                    inputs.taxFreeAssets +
                    inputs.illiquidAssets +
                    inputs.cashReserves,
                )}{" "}
                gross assets · {inputs.numSimulations.toLocaleString()} simulations
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
