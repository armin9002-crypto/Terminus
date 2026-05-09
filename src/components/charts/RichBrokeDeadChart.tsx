import { Area, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StackedBandDataPoint } from "@/types";
import { useSimStore } from "@/store/useSimStore";

const bands = [
  { key: "broke", label: "Broke", color: "#dc2626" },
  { key: "struggling", label: "Struggling", color: "#ea580c" },
  { key: "surviving", label: "Surviving", color: "#ca8a04" },
  { key: "thriving", label: "Thriving", color: "#16a34a" },
  { key: "flourishing", label: "Flourishing", color: "#0d9488" },
  { key: "dead", label: "Dead", color: "#475569" },
] as const;

function PercentTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey?: string; value?: number }>; label?: number }) {
  if (!active || !payload) return null;
  const values = new Map(payload.map((item) => [item.dataKey, Number(item.value ?? 0)]));
  return (
    <div className="rounded-lg border border-border bg-[#1e293b] p-3 text-sm text-primaryText shadow-xl">
      <p className="font-semibold">Age {label}</p>
      <div className="my-2 h-px bg-border" />
      {[...bands].reverse().map((band) => (
        <div key={band.key} className="grid grid-cols-[14px_1fr_auto] items-center gap-2 py-0.5">
          <span className="size-3 rounded-sm" style={{ backgroundColor: band.color }} />
          <span>{band.label}</span>
          <span className="font-semibold">{(values.get(band.key) ?? 0).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

export function RichBrokeDeadChart() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const isRunning = useSimStore((state) => state.isRunning);
  const data: StackedBandDataPoint[] = results?.stackedBands ?? [];

  if (isRunning) {
    return (
      <div className="h-[540px] animate-pulse rounded-lg border border-border bg-[#111827] p-6">
        <div className="h-full rounded-md bg-slate-700/40" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="h-[540px] min-h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 24, right: 28, bottom: 12, left: 8 }}>
            <CartesianGrid stroke="#2d3748" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#2d3748" }} />
            <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} width={58} />
            <Tooltip content={<PercentTooltip />} />
            <ReferenceLine x={inputs.retirementAge} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Retire", fill: "#f59e0b", position: "insideTopRight" }} />
            <ReferenceLine x={inputs.socialSecurityAge} stroke="#38bdf8" strokeDasharray="5 5" label={{ value: "SS", fill: "#38bdf8", position: "insideTopRight" }} />
            {bands.map((band) => (
              <Area key={band.key} type="monotone" dataKey={band.key} stackId="a" stroke="none" fill={band.color} fillOpacity={band.key === "dead" ? 0.7 : 0.92} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-mutedText">
        {bands.map((band) => (
          <span key={band.key} className="inline-flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ backgroundColor: band.color }} />
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}
