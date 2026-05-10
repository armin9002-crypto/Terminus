import { Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, ReferenceArea, ReferenceLine } from "recharts";
import { buildSpendingSmileSeries } from "../../engine/spendingSmile";
import { formatCompactCurrency } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";

export function SpendingSmileChart() {
  const inputs = useSimStore((state) => state.inputs);
  const data = buildSpendingSmileSeries(inputs);

  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#2d3748" strokeOpacity={0.55} vertical={false} />
          <ReferenceArea 
            x1={inputs.retirementAge} 
            x2={inputs.retirementAge + inputs.goGoYears} 
            fill="#22c55e" fillOpacity={0.06} 
            label={{ value: 'Go-Go', position: 'insideTop', fill: '#22c55e', fontSize: 11 }} 
          />
          <ReferenceArea 
            x1={inputs.retirementAge + inputs.goGoYears} 
            x2={inputs.retirementAge + inputs.goGoYears + inputs.slowGoYears} 
            fill="#f59e0b" fillOpacity={0.06}
            label={{ value: 'Slow-Go', position: 'insideTop', fill: '#f59e0b', fontSize: 11 }} 
          />
          <ReferenceArea 
            x1={inputs.retirementAge + inputs.goGoYears + inputs.slowGoYears} 
            x2={inputs.planningAge} 
            fill="#ef4444" fillOpacity={0.06}
            label={{ value: 'No-Go', position: 'insideTop', fill: '#ef4444', fontSize: 11 }} 
          />
          <ReferenceLine 
            x={inputs.retirementAge} 
            stroke="#f59e0b" 
            strokeDasharray="4 4" 
            label={{ value: 'Retire', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} 
          />
          <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#2d3748" }} />
          <YAxis tickFormatter={formatCompactCurrency} tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #2d3748", borderRadius: 8, color: "#f1f5f9" }}
            formatter={(value) => [formatCompactCurrency(Number(value)), "Median spend"]}
            labelFormatter={(age) => `Age ${age}`}
          />
          <Area type="monotone" dataKey="spending" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.22} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
