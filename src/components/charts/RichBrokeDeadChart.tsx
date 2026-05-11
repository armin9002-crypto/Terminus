import { Area, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StackedBandDataPoint } from "../../types";
import { useSimStore } from "../../store/useSimStore";

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
    <div className="rounded-lg border border-border bg-[var(--bg-card)] p-3 text-sm text-primaryText shadow-xl">
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
  
  const allBands: StackedBandDataPoint[] = results?.stackedBands ?? [];
  const data = allBands.filter(d => d.age >= inputs.retirementAge);

  const retirementAge = inputs.retirementAge;
  const midAge = Math.round((inputs.retirementAge + inputs.planningAge) / 2);
  const midPoint = data.find(d => d.age === midAge);

  if (isRunning) {
    return (
      <div className="h-[540px] animate-pulse rounded-lg border border-border bg-[var(--bg-card)] p-6">
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
      <div className="grid gap-3">
        {/* Color legend row */}
        <div className="flex flex-wrap gap-4">
          {bands.map(band => (
            <span key={band.key} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="h-3 w-3 rounded-sm" style={{backgroundColor: band.color}} />
              {band.label}
            </span>
          ))}
        </div>

        {/* Mid-retirement snapshot */}
        {midPoint && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              At age {midAge} (mid-retirement snapshot)
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {bands.map(band => (
                <div key={band.key} className="text-center">
                  <p className="text-lg font-bold" style={{color: band.color}}>
                    {(midPoint[band.key as keyof StackedBandDataPoint] as number).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {band.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
