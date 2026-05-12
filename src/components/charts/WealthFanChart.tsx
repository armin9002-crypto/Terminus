import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Slider } from "../../components/ui/slider";
import { formatCompactCurrency, formatMillions } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";
import type { PercentilesAtAge } from "../../types";

interface ChartDatum extends PercentilesAtAge {
  // These are tuples for Recharts Area component to render bands
  p10p90: [number, number];
  p25p75: [number, number];
}

function chartData(data: PercentilesAtAge[]): ChartDatum[] {
  return data.map((point) => ({
    ...point,
    p10p90: [point.p10, point.p90],
    p25p75: [point.p25, point.p75],
  }));
}

export function WealthFanChart() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const setInput = useSimStore((state) => state.setInput);
  const isRunning = useSimStore((state) => state.isRunning);

  const [showWide, setShowWide] = useState(false);
  const [showNarrow, setShowNarrow] = useState(false);
  const [showReal, setShowReal] = useState(false);

  const combinedSalary = inputs.annualSalary + (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;

  const retirePoint = results?.percentilePaths.find(p => p.age === inputs.retirementAge);
  const retirePlusFive = results?.percentilePaths.find(p => p.age === inputs.retirementAge + 5);
  
  const sequenceRisk = retirePoint && retirePlusFive && retirePoint.p10 > 0
    ? (retirePlusFive.p10 - retirePoint.p10) / retirePoint.p10
    : 0;

  function toReal(nominalValue: number, age: number): number {
    if (!showReal) return nominalValue;
    const years = age - inputs.currentAge;
    return nominalValue / Math.pow(1 + inputs.inflationRate, years);
  }

  const data = chartData(results?.percentilePaths ?? []);

  const realData = data.map((point) => ({
    ...point,
    p10: toReal(point.p10, point.age),
    p25: toReal(point.p25, point.age),
    p50: toReal(point.p50, point.age),
    p75: toReal(point.p75, point.age),
    p90: toReal(point.p90, point.age),
    p10p90: [toReal(point.p10p90[0], point.age), toReal(point.p10p90[1], point.age)] as [number, number],
    p25p75: [toReal(point.p25p75[0], point.age), toReal(point.p25p75[1], point.age)] as [number, number],
  }));

  if (isRunning) {
    return <div className="h-[520px] animate-pulse rounded-lg border border-border bg-slate-700/30" />;
  }

  return (
    <div className="grid gap-4">
      <div className="h-[520px] min-h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={realData} margin={{ top: 20, right: 28, left: 10, bottom: 12 }}>
            <CartesianGrid stroke="#2d3748" strokeOpacity={0.55} vertical={false} />
            <XAxis
              dataKey="age"
              type="number"
              domain={[inputs.currentAge, inputs.planningAge]}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#2d3748" }}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={formatMillions}
              tickLine={false}
              axisLine={false}
              width={82}
            />
            <Tooltip
              cursor={{ stroke: "#14b8a6", strokeOpacity: 0.35 }}
              contentStyle={{
                background: "var(--bg-card)",
                border: "1px solid #2d3748",
                borderRadius: 8,
                color: "#f1f5f9",
              }}
              formatter={(value, name) => {
                if (Array.isArray(value)) {
                  return [
                    `${formatCompactCurrency(Number(value[0]))} - ${formatCompactCurrency(Number(value[1]))}`,
                    name,
                  ];
                }

                return [formatCompactCurrency(Number(value)), name];
              }}
              labelFormatter={(age) => `Age ${age}`}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
            <ReferenceLine
              y={0}
              stroke="#dc2626"
              strokeDasharray="5 5"
            />
            <ReferenceLine
              x={inputs.retirementAge}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: "Retire", fill: "#f59e0b", position: "insideTopRight" }}
            />
            <ReferenceLine
              x={inputs.socialSecurityAge}
              stroke="#38bdf8"
              strokeDasharray="5 5"
              label={{ value: "SS Starts", fill: "#38bdf8", position: "insideTopRight" }}
            />
            {showWide && (
              <Area
                type="monotone"
                dataKey="p10p90"
                name="10th-90th percentile"
                stroke="none"
                fill="#14b8a6"
                fillOpacity={0.15}
                activeDot={false}
              />
            )}
            {showNarrow && (
              <Area
                type="monotone"
                dataKey="p25p75"
                name="25th-75th percentile"
                stroke="none"
                fill="#14b8a6"
                fillOpacity={0.25}
                activeDot={false}
              />
            )}
            <Line type="monotone" dataKey="p50" name="Median" stroke="#e2fffb" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showWide}
            onChange={(e) => setShowWide(e.target.checked)}
            className="accent-[var(--accent)] h-3.5 w-3.5"
          />
          <span className="text-[11px] text-[var(--text-muted)]">10th-90th percentile band</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showNarrow}
            onChange={(e) => setShowNarrow(e.target.checked)}
            className="accent-[var(--accent)] h-3.5 w-3.5"
          />
          <span className="text-[11px] text-[var(--text-muted)]">25th-75th percentile band</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showReal}
            onChange={(e) => setShowReal(e.target.checked)}
            className="accent-[var(--accent)] h-3.5 w-3.5"
          />
          <span className="text-[11px] text-[var(--text-muted)]">
            Real terms ({(inputs.inflationRate * 100).toFixed(1)}% inflation-adjusted)
          </span>
        </label>
      </div>
      <div className="rounded-md border border-border bg-[var(--bg-card)] p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-[0.18em] text-mutedText">Drag retirement marker</span>
          <span className="font-semibold text-warning">Age {inputs.retirementAge}</span>
        </div>
        <Slider
          value={[inputs.retirementAge]}
          min={inputs.currentAge + 1}
          max={inputs.planningAge - 1}
          step={1}
          onValueChange={([value]) => setInput("retirementAge", value ?? inputs.retirementAge)}
        />
      </div>
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-2">
        Combined pre-retirement income: {formatCompactCurrency(combinedSalary)}/yr 
        over {yearsToRetirement} years. Showing {inputs.numSimulations.toLocaleString()} simulated paths
        {showReal ? ` in real (${(inputs.inflationRate * 100).toFixed(1)}% inflation-adjusted) ${new Date().getFullYear()} dollars` : " in nominal dollars"}.
      </p>
      {sequenceRisk < -0.25 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm">
          <span className="font-bold text-red-300">
            WARNING: Sequence of Returns Risk Detected
          </span>
          <p className="mt-1 text-[var(--text-muted)]">
            In the worst 10% of scenarios, your portfolio drops 
            {Math.abs(sequenceRisk * 100).toFixed(0)}% in the 
            first 5 years of retirement. A market downturn early 
            in retirement is especially damaging -- consider 
            maintaining 2 years of cash reserves as a buffer.
          </p>
        </div>
      )}
    </div>
  );
}
