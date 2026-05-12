import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CARRY_DISTRIBUTION_CURVE } from "../../lib/constants";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";
import type { CarryAward } from "../../types";

const FEDERAL_LTCG = 0.20;
const NIIT = 0.038;

interface AwardYear {
  calYear: number;
  fundYear: number;
  grossDistribution: number;
  netDistribution: number;
  gpCommit: number;
  cumulativeNet: number;
}

function computeAwardTimeline(award: CarryAward, stateIncomeTaxRate: number): AwardYear[] {
  const taxRate = Math.min(FEDERAL_LTCG + NIIT + stateIncomeTaxRate, 0.55);
  let cumulative = 0;

  return CARRY_DISTRIBUTION_CURVE.map((curvePct, i) => {
    const fundYear = i + 1;
    const calYear = award.vintageYear + i;
    const gross =
      award.totalPoolValue * award.poolValueCapture * award.vestedPercent * curvePct;
    const net = gross * (1 - taxRate);
    const gpCommit =
      fundYear <= 3 ? -((award.totalPoolValue * award.gpCommitPercent) / 3) : 0;
    cumulative += net + gpCommit;

    return { calYear, fundYear, grossDistribution: gross, netDistribution: net, gpCommit, cumulativeNet: cumulative };
  });
}

export function CarryAwardsChart() {
  const inputs = useSimStore((state) => state.inputs);

  if (inputs.carryAwards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold text-[var(--text-muted)]">No carry awards added yet.</p>
        <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs">
          Add carry awards in the sidebar to model PE carry distributions
          and GP commit outflows across your simulation.
        </p>
      </div>
    );
  }

  const effectiveLtcgRate = Math.min(FEDERAL_LTCG + NIIT + inputs.stateIncomeTaxRate, 0.55);

  return (
    <div className="grid gap-6">
      {inputs.carryAwards.map((award) => {
        const data = computeAwardTimeline(award, inputs.stateIncomeTaxRate);

        const totalGross =
          award.totalPoolValue * award.poolValueCapture * award.vestedPercent;
        const totalNet = totalGross * (1 - effectiveLtcgRate);
        const totalGPCommit = award.totalPoolValue * award.gpCommitPercent;
        const netCash = totalNet - totalGPCommit;
        const firstDistYear = award.vintageYear + 2;
        const peakYears = `${award.vintageYear + 6}-${award.vintageYear + 8}`;

        return (
          <div
            key={award.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 grid gap-4"
          >
            {/* Header */}
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{award.label}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Vintage {award.vintageYear} | {formatPercentage(award.vestedPercent, 0)} vested | {formatPercentage(award.poolValueCapture, 0)} capture | {formatPercentage(effectiveLtcgRate, 1)} effective LTCG rate
              </p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Effective Pool", value: formatCompactCurrency(totalGross), color: "" },
                {
                  label: "Net After Tax",
                  value: formatCompactCurrency(totalNet),
                  color: "text-[var(--success)]",
                },
                {
                  label: "Total GP Commit",
                  value: `-${formatCompactCurrency(totalGPCommit)}`,
                  color: "text-[var(--danger)]",
                },
                {
                  label: "Net Cash",
                  value: formatCompactCurrency(netCash),
                  color: netCash >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-center"
                >
                  <p className={`text-sm font-bold tabular-nums ${stat.color || "text-[var(--text-primary)]"}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Distribution timeline chart */}
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke="#2d3748" strokeOpacity={0.4} vertical={false} />
                  <XAxis
                    dataKey="calYear"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#2d3748" }}
                  />
                  <YAxis
                    tickFormatter={formatCompactCurrency}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid #2d3748",
                      borderRadius: 8,
                      color: "#f1f5f9",
                    }}
                    formatter={(value, name) => [formatCompactCurrency(Number(value)), name]}
                    labelFormatter={(year) => `${year} (Fund Year ${data.find((d) => d.calYear === Number(year))?.fundYear ?? ""})`}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeOpacity={0.5} />
                  <Bar
                    dataKey="gpCommit"
                    name="GP Commit (outflow)"
                    fill="#dc2626"
                    fillOpacity={0.75}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="netDistribution"
                    name="Net Distribution"
                    fill="#16a34a"
                    fillOpacity={0.85}
                    radius={[2, 2, 0, 0]}
                  />
                  <Line
                    dataKey="cumulativeNet"
                    name="Cumulative Net Cash"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                    type="monotone"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline annotation */}
            <p className="text-[10px] text-[var(--text-muted)]">
              First distribution {firstDistYear} | Peak distributions {peakYears} | GP commit called {award.vintageYear}-{award.vintageYear + 2}
            </p>
          </div>
        );
      })}

      {/* Aggregate summary if multiple awards */}
      {inputs.carryAwards.length > 1 && (() => {
        const totalNetAll = inputs.carryAwards.reduce((sum, a) => {
          const gross = a.totalPoolValue * a.poolValueCapture * a.vestedPercent;
          return sum + gross * (1 - effectiveLtcgRate);
        }, 0);
        const totalGPAll = inputs.carryAwards.reduce(
          (sum, a) => sum + a.totalPoolValue * a.gpCommitPercent,
          0
        );
        return (
          <div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              All Awards Combined
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-[var(--success)] font-bold">{formatCompactCurrency(totalNetAll)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Total Net Carry</p>
              </div>
              <div>
                <p className="text-[var(--danger)] font-bold">-{formatCompactCurrency(totalGPAll)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Total GP Commit</p>
              </div>
              <div>
                <p className={`font-bold ${(totalNetAll - totalGPAll) >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {formatCompactCurrency(totalNetAll - totalGPAll)}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">Net Cash All Awards</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}