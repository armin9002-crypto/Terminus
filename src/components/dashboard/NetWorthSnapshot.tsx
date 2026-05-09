import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getInvestableAssets } from "@/engine/monteCarlo";
import { formatCompactCurrency } from "@/lib/formatters";
import type { SimInputs } from "@/types";

interface NetWorthSnapshotProps {
  inputs: SimInputs;
}

const colors = ["#14b8a6", "#3b82f6", "#22c55e", "#64748b", "#94a3b8"];

export function NetWorthSnapshot({ inputs }: NetWorthSnapshotProps) {
  const data = [
    { name: "Taxable", value: inputs.taxableAssets },
    { name: "Tax-Deferred", value: inputs.taxDeferredAssets },
    { name: "Tax-Free", value: inputs.taxFreeAssets },
    { name: "Illiquid", value: inputs.illiquidAssets },
    { name: "Cash", value: inputs.cashReserves },
  ];
  const gross = data.reduce((sum, item) => sum + item.value, 0);
  const liquid = getInvestableAssets(inputs);
  const liquidPct = gross > 0 ? (liquid / gross) * 100 : 0;

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mutedText">Net Worth Snapshot</p>
        <p className="text-sm font-semibold text-primaryText">Total {formatCompactCurrency(gross)}</p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px] lg:items-center">
        <div>
          <div className="flex h-4 overflow-hidden rounded-full bg-slate-800">
            {data.map((item, index) => (
              <div key={item.name} style={{ width: `${gross > 0 ? (item.value / gross) * 100 : 0}%`, backgroundColor: colors[index] }} />
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-mutedText sm:grid-cols-3">
            <span>Liquid: <strong className="text-primaryText">{formatCompactCurrency(liquid)} ({liquidPct.toFixed(0)}%)</strong></span>
            <span>Illiquid: <strong className="text-primaryText">{formatCompactCurrency(inputs.illiquidAssets)}</strong></span>
            <span>Total: <strong className="text-primaryText">{formatCompactCurrency(gross)}</strong></span>
          </div>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #2d3748", color: "#f1f5f9" }} formatter={(value) => formatCompactCurrency(Number(value))} />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={2}>
                {data.map((item, index) => <Cell key={item.name} fill={colors[index]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
