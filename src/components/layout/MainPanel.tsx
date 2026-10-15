import { ArrowRight, ArrowUpRight, PiggyBank, ShieldAlert, TrendingUp } from 'lucide-react';
import { RichBrokeDeadChart } from '../charts/RichBrokeDeadChart';
import { CarryAwardsChart } from '../charts/CarryAwardsChart';
import { ScenarioCompareChart } from '../charts/ScenarioCompareChart';
import { InfoPage } from './InfoPage';
import { SpendingSmileChart } from '../charts/SpendingSmileChart';
import { StressTestChart } from '../charts/StressTestChart';
import { WealthFanChart } from '../charts/WealthFanChart';
import { HeroVerdict } from '../dashboard/HeroVerdict';
import { NetWorthSnapshot } from '../dashboard/NetWorthSnapshot';
import { StatCard } from '../dashboard/StatCard';
import { TaxBreakdownPanel } from '../dashboard/TaxBreakdownPanel';
import { ExecutiveSummary } from '../dashboard/ExecutiveSummary';
import { RetirementIncomeWaterfallChart } from './RetirementIncomeWaterfallChart';
import { WithdrawalRateChart } from './WithdrawalRateChart';
import { SensitivityTornadoChart } from '../charts/SensitivityTornadoChart';
import { TaxDragTimelineChart } from './TaxDragTimelineChart';
import { BucketDepletionChart } from './BucketDepletionChart';
import { Sidebar } from './Sidebar';
import { PlanActions } from './PlanActions';
import { formatCompactCurrency, formatPercentage } from '../../lib/formatters';
import { analyses, type Analysis, type AppRoute } from '../../lib/navigation';
import { useSimStore } from '../../store/useSimStore';

function AnalysisContent({ analysis }: { analysis: Analysis }) {
  switch (analysis) {
    case 'rich': return <RichBrokeDeadChart />;
    case 'wealth': return <WealthFanChart />;
    case 'buckets': return <BucketDepletionChart />;
    case 'spending': return <SpendingSmileChart />;
    case 'cashflows': return <RetirementIncomeWaterfallChart />;
    case 'withdrawals': return <WithdrawalRateChart />;
    case 'tax': return <TaxBreakdownPanel />;
    case 'taxdrag': return <TaxDragTimelineChart />;
    case 'scenarios': return <ScenarioCompareChart />;
    case 'stress': return <StressTestChart />;
    case 'sensitivity': return <SensitivityTornadoChart />;
    case 'carry': return <CarryAwardsChart />;
  }
}
const groups = [...new Set(analyses.map(item => item.group))];

function ExploreNavigation({ analysis }: { analysis: Analysis }) {
  return <>
    <nav className="explore-navigation" aria-label="Analyses">{groups.map(group => <div key={group}><p>{group}</p>{analyses.filter(item => item.group === group).map(item => <a key={item.id} href={`#explore/${item.id}`} aria-current={item.id === analysis ? 'page' : undefined}>{item.label}{item.id === analysis ? <ArrowUpRight size={14} /> : null}</a>)}</div>)}</nav>
    <label className="analysis-selector">Analysis<select value={analysis} onChange={event => { window.location.hash = `explore/${event.target.value}`; }}>{groups.map(group => <optgroup label={group} key={group}>{analyses.filter(item => item.group === group).map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>)}</select></label>
  </>;
}

export function MainPanel({ route }: { route: AppRoute }) {
  const inputs = useSimStore(state => state.inputs);
  const results = useSimStore(state => state.results);
  const hasErrors = useSimStore(state => Object.keys(state.errors).length > 0);
  const isRunning = useSimStore(state => state.isRunning);
  const activeAnalysis = analyses.find(item => item.id === route.analysis)!;
  const titles = { overview: 'Your future, in perspective.', plan: 'A plan shaped around you.', explore: activeAnalysis.label, report: 'Your plan. The complete picture.', guide: 'Understand the model.' };
  const descriptions = { overview: 'A living view of your wealth and the possibilities ahead.', plan: 'The assumptions behind every possibility. Refine them here.', explore: activeAnalysis.description, report: 'An executive summary of your current financial plan.', guide: 'The assumptions, methods, and mechanics behind the Number.' };
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">{route.destination === 'explore' ? `Explore / ${activeAnalysis.group}` : route.destination === 'guide' ? 'Model guide' : `Your wealth / ${route.destination}`}</p><h1 tabIndex={-1} data-page-heading>{titles[route.destination]}</h1><p className="page-description">{descriptions[route.destination]}</p></div>
      {route.destination !== 'plan' && route.destination !== 'guide' ? <a href="#plan" className="button-primary">Edit plan <ArrowUpRight size={17} /></a> : null}
    </div>
    <div className="plan-context"><span>Personal plan</span><span>Age {inputs.currentAge} <ArrowRight size={12} /> {inputs.planningAge}</span><span>{inputs.numSimulations.toLocaleString()} paths</span><span className="context-freshness">{hasErrors ? 'Review inputs · last valid results' : isRunning ? 'Updating · previous results shown' : results ? 'Current results' : 'Awaiting valid inputs'}</span></div>
    {hasErrors ? <div className="form-message" role="alert">Results reflect the last valid plan. <a href="#plan">Review your inputs <ArrowRight size={14} /></a></div> : null}
    {route.destination === 'overview' ? <div className="overview-content view-enter">
      <HeroVerdict inputs={inputs} results={results} />
      <NetWorthSnapshot inputs={inputs} />
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <StatCard icon={ShieldAlert} label="Ruin Probability" value={results ? formatPercentage(results.ruinProbability, 1) : '--'} description="Paths that ever depleted during retirement." tone={results ? results.ruinProbability > 0.2 ? 'danger' : results.ruinProbability >= 0.1 ? 'warning' : 'success' : 'neutral'} sparklineData={results?.percentilePaths.map(p => p.p10) ?? []} sparklineColor="var(--danger)" />
        <StatCard icon={PiggyBank} label="Median Terminal Wealth" value={results ? formatCompactCurrency(results.medianTerminalWealth) : '--'} description={`Median portfolio value at age ${inputs.planningAge}.`} tone="neutral" sparklineData={results?.percentilePaths.map(p => p.p50) ?? []} sparklineColor="var(--accent)" />
        <StatCard icon={TrendingUp} label="Success Rate" value={results ? formatPercentage(results.successRate, 1) : '--'} description="Inverse of probability of ruin." tone={results ? results.successRate >= 0.85 ? 'success' : results.successRate >= 0.7 ? 'warning' : 'danger' : 'neutral'} sparklineData={results?.stackedBands.map(b => b.flourishing + b.thriving + b.surviving) ?? []} sparklineColor="var(--success)" />
      </div>
      <section className="analysis-plane"><div className="section-heading"><div><p className="eyebrow">The long view</p><h2>Life outcomes</h2></div><a href="#explore/rich">Explore analysis <ArrowUpRight size={16} /></a></div><RichBrokeDeadChart /></section>
      <div className="explore-invitation"><span>A different question. A new perspective.</span><a href="#explore/wealth">Explore your plan <ArrowRight size={17} /></a></div>
    </div> : null}
    {route.destination === 'plan' ? <div className="plan-layout view-enter"><div className="plan-editor"><Sidebar /><PlanActions /></div><aside className="plan-aside"><p className="eyebrow">Your perspective</p><h2>Small changes.<br />Different futures.</h2><p>Changes update the model automatically. Return to Overview to see how your plan unfolds.</p><a href="#overview">View overview <ArrowUpRight size={16} /></a><div className="plan-aside-note">Inputs are stored locally when browser storage is available. Theme and navigation are handled separately.</div></aside></div> : null}
    {route.destination === 'explore' ? <div className="explore-layout view-enter"><ExploreNavigation analysis={route.analysis} /><section className="analysis-plane analytical-content" key={route.analysis} aria-label={activeAnalysis.label}>{route.analysis === 'sensitivity' || route.analysis === 'stress' ? <><p className="analysis-scroll-hint">Scroll horizontally to inspect all columns.</p><div className="analysis-scroll" role="region" aria-label={`${activeAnalysis.label} table, horizontally scrollable`} tabIndex={0}><div className="analysis-scroll-content"><AnalysisContent analysis={route.analysis} /></div></div></> : <AnalysisContent analysis={route.analysis} />}</section></div> : null}
    {route.destination === 'report' ? <article className="reading-plane analytical-content view-enter"><ExecutiveSummary /></article> : null}
    {route.destination === 'guide' ? <article className="reading-plane analytical-content view-enter"><a className="back-link" href="#overview">← Back to Overview</a><InfoPage /></article> : null}
  </>;
}
