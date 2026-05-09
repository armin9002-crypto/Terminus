import { Landmark, PiggyBank, ShieldAlert, TrendingUp } from "lucide-react";
import { HeroVerdict } from "@/components/dashboard/HeroVerdict";
import { StatCard } from "@/components/dashboard/StatCard";
import { NetWorthBreakdown } from "@/components/dashboard/NetWorthBreakdown";
import { WealthFanChart } from "@/components/charts/WealthFanChart";
import { SpendingSmileChart } from "@/components/charts/SpendingSmileChart";
import { ScenarioCompareChart } from "@/components/charts/ScenarioCompareChart";
import { ProbabilityGauge } from "@/components/charts/ProbabilityGauge";
import { StressTestModal } from "@/components/modals/StressTestModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactCurrency, formatPercentage } from "@/lib/formatters";
import { useSimStore } from "@/store/useSimStore";

function ruinTone(ruinProbability: number) {
  if (ruinProbability > 0.2) return "danger";
  if (ruinProbability >= 0.1) return "warning";
  return "success";
}

export function MainPanel() {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const ruinProbability = results?.ruinProbability ?? 0;
  const successRate = results?.successRate ?? 0;

  return (
    <section className="grid gap-4 p-4 lg:p-6">
      <HeroVerdict inputs={inputs} results={results} />

      <div className="grid gap-4 xl:grid-cols-[1fr_180px]">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={ShieldAlert}
            label="Ruin Probability"
            value={formatPercentage(ruinProbability, 1)}
            description="Share of simulations depleted before the planning age."
            tone={ruinTone(ruinProbability)}
          />
          <StatCard
            icon={PiggyBank}
            label="Median Terminal Wealth"
            value={formatCompactCurrency(results?.medianTerminalWealth ?? 0)}
            description={`Median portfolio value at age ${inputs.planningAge}.`}
            tone="neutral"
          />
          <StatCard
            icon={TrendingUp}
            label="Success Rate"
            value={formatPercentage(successRate, 1)}
            description="Inverse of ruin probability across all paths."
            tone={successRate > 0.85 ? "success" : successRate >= 0.7 ? "warning" : "danger"}
          />
        </div>
        <Card className="shadow-none">
          <CardContent className="grid h-full place-items-center p-4">
            <ProbabilityGauge value={successRate} />
          </CardContent>
        </Card>
      </div>

      <NetWorthBreakdown inputs={inputs} />

      <Tabs defaultValue="wealth">
        <Card className="shadow-none">
          <CardHeader className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
                <Landmark size={14} />
                Institutional forecast
              </div>
              <h2 className="mt-2 text-xl font-bold text-primaryText">Probability-band analytics</h2>
            </div>
            <TabsList className="w-full overflow-x-auto lg:w-auto">
              <TabsTrigger value="wealth">Wealth Trajectory</TabsTrigger>
              <TabsTrigger value="spending">Spending Plan</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="stress">Stress Tests</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-4">
            <TabsContent value="wealth">
              <WealthFanChart />
            </TabsContent>
            <TabsContent value="spending">
              <SpendingSmileChart />
            </TabsContent>
            <TabsContent value="scenarios">
              <ScenarioCompareChart />
            </TabsContent>
            <TabsContent value="stress">
              <StressTestModal />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}
