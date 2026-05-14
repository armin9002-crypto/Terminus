import { PiggyBank, ShieldAlert, TrendingUp } from "lucide-react";
import { RichBrokeDeadChart } from "../../components/charts/RichBrokeDeadChart";
import { CarryAwardsChart } from "../../components/charts/CarryAwardsChart";
import { ScenarioCompareChart } from "../../components/charts/ScenarioCompareChart";
import { InfoPage } from "../../components/layout/InfoPage";
import { SpendingSmileChart } from "../../components/charts/SpendingSmileChart";
import { StressTestChart } from "../../components/charts/StressTestChart";
import { WealthFanChart } from "../../components/charts/WealthFanChart";
import { HeroVerdict } from "../../components/dashboard/HeroVerdict";
import { StatCard } from "../../components/dashboard/StatCard";
import { TaxBreakdownPanel } from "../../components/dashboard/TaxBreakdownPanel";
import { ExecutiveSummary } from "../../components/dashboard/ExecutiveSummary";
import { RetirementIncomeWaterfallChart } from "./RetirementIncomeWaterfallChart";
import { WithdrawalRateChart } from "./WithdrawalRateChart";
import { SensitivityTornadoChart } from "../../components/charts/SensitivityTornadoChart";
import { TaxDragTimelineChart } from "./TaxDragTimelineChart";
import { BucketDepletionChart } from "./BucketDepletionChart";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { formatCompactCurrency, formatPercentage } from "../../lib/formatters";
import { useSimStore } from "../../store/useSimStore";

function ruinTone(ruinProbability: number) {
  if (ruinProbability > 0.2) return "danger";
  if (ruinProbability >= 0.1) return "warning";
  return "success";
}

interface MainPanelProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function MainPanel({ activeTab = "rich", onTabChange }: MainPanelProps) {
  const inputs = useSimStore((state) => state.inputs);
  const results = useSimStore((state) => state.results);
  const errors = useSimStore((state) => state.errors);
  const hasErrors = Object.keys(errors).length > 0;
  const isRunning = useSimStore((state) => state.isRunning);

  return (
    <section className="grid gap-3 p-3 pb-24 md:pb-3 lg:p-4">
      {hasErrors ? <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm font-semibold text-red-200">Fix inputs above to update simulation</div> : null}
      
      <div className={`overflow-hidden transition-all duration-500 ${
        isRunning ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
          Recalculating...
        </div>
      </div>

      <HeroVerdict inputs={inputs} results={results} />
      {/* <NetWorthSnapshot inputs={inputs} /> */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard 
          icon={ShieldAlert} 
          label="Ruin Probability" 
          value={results ? formatPercentage(results.ruinProbability, 1) : "--"} 
          description="Paths that ever depleted during retirement." 
          tone={results ? ruinTone(results.ruinProbability) : "neutral"} 
          sparklineData={results?.percentilePaths.map(p => p.p10) ?? []}
          sparklineColor="#ef4444"
        />
        <StatCard 
          icon={PiggyBank} 
          label="Median Terminal Wealth" 
          value={results ? formatCompactCurrency(results.medianTerminalWealth) : "--"} 
          description={`Median portfolio value at age ${inputs.planningAge}.`} 
          tone="neutral" 
          sparklineData={results?.percentilePaths.map(p => p.p50) ?? []}
          sparklineColor="var(--accent)"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Success Rate" 
          value={results ? formatPercentage(results.successRate, 1) : "--"} 
          description="Inverse of probability of ruin." 
          tone={results && results.successRate >= 0.85 ? "success" : results && results.successRate >= 0.7 ? "warning" : "danger"} 
          sparklineData={results?.stackedBands.map(b => b.flourishing + b.thriving + b.surviving) ?? []}
          sparklineColor="#22c55e"
        />
      </div>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <Card className="shadow-none">
          <CardHeader className="p-3">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="rich">Rich/Broke/Dead</TabsTrigger>
              <TabsTrigger value="wealth">Wealth Trajectories</TabsTrigger>
              <TabsTrigger value="spending">Spending Plan</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="stress">Stress Tests</TabsTrigger>
              <TabsTrigger value="tax">Income Tax</TabsTrigger>
              <TabsTrigger value="carry">Carry Awards</TabsTrigger>
              <TabsTrigger value="cashflows">Cash Flows</TabsTrigger>
              <TabsTrigger value="summary">Executive Summary</TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:text-[var(--accent)] border border-transparent data-[state=active]:border-[var(--accent)]/30">
                How It Works
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-3">
            <TabsContent value="rich"><RichBrokeDeadChart /></TabsContent>
            <TabsContent value="wealth">
              <div className="grid gap-8">
                <WealthFanChart />
                <div className="h-px bg-[var(--border)]" />
                <BucketDepletionChart />
              </div>
            </TabsContent>
            <TabsContent value="spending"><SpendingSmileChart /></TabsContent>
            <TabsContent value="scenarios"><ScenarioCompareChart /></TabsContent>
            <TabsContent value="stress">
              <div className="grid gap-8">
                <StressTestChart />
                <div className="h-px bg-[var(--border)]" />
                <SensitivityTornadoChart />
              </div>
            </TabsContent>
            <TabsContent value="tax">
              <div className="grid gap-8">
                <TaxBreakdownPanel />
                <div className="h-px bg-[var(--border)]" />
                <TaxDragTimelineChart />
              </div>
            </TabsContent>
            <TabsContent value="carry"><CarryAwardsChart /></TabsContent>
            <TabsContent value="cashflows">
              <div className="grid gap-8">
                <RetirementIncomeWaterfallChart />
                <div className="h-px bg-[var(--border)]" />
                <WithdrawalRateChart />
              </div>
            </TabsContent>
            <TabsContent value="summary"><ExecutiveSummary /></TabsContent>
            <TabsContent value="info"><InfoPage /></TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </section>
  );
}
