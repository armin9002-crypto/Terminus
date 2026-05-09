import { Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart } from "recharts";
import { buildSpendingSmileSeries } from "@/engine/spendingSmile";
import { formatCompactCurrency } from "@/lib/formatters";
import { useSimStore } from "@/store/useSimStore";

export function SpendingSmileChart() {
  const inputs = useSimStore((state) => state.inputs);
  const data = buildSpendingSmileSeries(inputs);

  return (
    <div className="h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#2d3748" strokeOpacity={0.55} vertical={false} />
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
