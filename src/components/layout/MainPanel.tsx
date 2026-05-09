import { PiggyBank, ShieldAlert, TrendingUp } from "lucide-react";
import { RichBrokeDeadChart } from "@/components/charts/RichBrokeDeadChart";
import { ScenarioCompareChart } from "@/components/charts/ScenarioCompareChart";
import { SpendingSmileChart } from "@/components/charts/SpendingSmileChart";
import { StressTestChart } from "@/components/charts/StressTestChart";
import { WealthFanChart } from "@/components/charts/WealthFanChart";
import { HeroVerdict } from "@/components/dashboard/HeroVerdict";
import { NetWorthSnapshot } from "@/components/dashboard/NetWorthSnapshot";
import { StatCard } from "@/components/dashboard/StatCard";
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
  const errors = useSimStore((state) => state.errors);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <section className="grid gap-4 p-4 pb-28 md:pb-4 lg:p-6">
      {hasErrors ? <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm font-semibold text-red-200">Fix inputs above to update simulation</div> : null}
      <HeroVerdict inputs={inputs} results={results} />
      <NetWorthSnapshot inputs={inputs} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={ShieldAlert} label="Ruin Probability" value={results ? formatPercentage(results.ruinProbability, 1) : "--"} description="Paths that ever depleted during retirement." tone={results ? ruinTone(results.ruinProbability) : "neutral"} />
        <StatCard icon={PiggyBank} label="Median Terminal Wealth" value={results ? formatCompactCurrency(results.medianTerminalWealth) : "--"} description={`Median portfolio value at age ${inputs.planningAge}.`} tone="neutral" />
        <StatCard icon={TrendingUp} label="Success Rate" value={results ? formatPercentage(results.successRate, 1) : "--"} description="Inverse of probability of ruin." tone={results && results.successRate >= 0.85 ? "success" : results && results.successRate >= 0.7 ? "warning" : "danger"} />
      </div>
      <Tabs defaultValue="rich">
        <Card className="shadow-none">
          <CardHeader className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Probability Analytics</p>
              <h2 className="mt-2 text-xl font-bold text-primaryText">Rich, Broke or Dead</h2>
            </div>
            <TabsList className="w-full overflow-x-auto lg:w-auto">
              <TabsTrigger value="rich">Rich/Broke/Dead</TabsTrigger>
              <TabsTrigger value="wealth">Wealth Trajectories</TabsTrigger>
              <TabsTrigger value="spending">Spending Plan</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="stress">Stress Tests</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-4">
            <TabsContent value="rich"><RichBrokeDeadChart /></TabsContent>
            <TabsContent value="wealth"><WealthFanChart /></TabsContent>
            <TabsContent value="spending"><SpendingSmileChart /></TabsContent>
            <TabsContent value="scenarios"><ScenarioCompareChart /></TabsContent>
            <TabsContent value="stress"><StressTestChart /></TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}
