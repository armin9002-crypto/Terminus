import { formatCompactCurrency } from "@/lib/formatters";
import type { SimInputs } from "@/types";

interface NetWorthBreakdownProps {
  inputs: SimInputs;
}

export function NetWorthBreakdown({ inputs }: NetWorthBreakdownProps) {
  const buckets = [
    ["Taxable", inputs.taxableAssets, "bg-teal-300"],
    ["Tax deferred", inputs.taxDeferredAssets, "bg-sky-300"],
    ["Tax free", inputs.taxFreeAssets, "bg-emerald-300"],
    ["Illiquid", inputs.illiquidAssets, "bg-amber-300"],
    ["Cash", inputs.cashReserves, "bg-slate-300"],
  ] as const;
  const total = buckets.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mutedText">Net worth breakdown</p>
        <p className="text-sm font-semibold text-primaryText">{formatCompactCurrency(total)}</p>
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-800">
        {buckets.map(([label, value, color]) => (
          <div key={label} className={color} style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }} />
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {buckets.map(([label, value, color]) => (
          <div key={label} className="flex items-center gap-2 text-xs text-mutedText">
            <span className={cnDot(color)} />
            <span>{label}</span>
            <span className="ml-auto text-primaryText">{formatCompactCurrency(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function cnDot(color: string) {
  return `size-2 rounded-full ${color}`;
}
