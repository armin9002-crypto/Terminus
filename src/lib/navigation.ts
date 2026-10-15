export const analyses = [
  { id: 'rich', label: 'Life outcomes', group: 'Outcomes', description: 'How might life and wealth unfold together?' },
  { id: 'wealth', label: 'Wealth trajectories', group: 'Outcomes', description: 'See the range of possible portfolio values over time.' },
  { id: 'buckets', label: 'Account buckets', group: 'Outcomes', description: 'Follow the projected balance of each account type.' },
  { id: 'spending', label: 'Spending plan', group: 'Spending & income', description: 'Explore spending through the phases of retirement.' },
  { id: 'cashflows', label: 'Cash flows', group: 'Spending & income', description: 'Understand the sources funding your retirement.' },
  { id: 'withdrawals', label: 'Withdrawal rates', group: 'Spending & income', description: 'Inspect portfolio withdrawals through retirement.' },
  { id: 'tax', label: 'Income tax', group: 'Taxes', description: 'Inspect the current income tax breakdown.' },
  { id: 'taxdrag', label: 'Tax timeline', group: 'Taxes', description: 'Explore estimated taxes across the planning horizon.' },
  { id: 'scenarios', label: 'Scenario comparison', group: 'Scenarios & risk', description: 'Compare the existing retirement timing scenarios.' },
  { id: 'stress', label: 'Stress tests', group: 'Scenarios & risk', description: 'Test the plan against adverse market conditions.' },
  { id: 'sensitivity', label: 'Sensitivity', group: 'Scenarios & risk', description: 'See which assumptions have the greatest influence.' },
  { id: 'carry', label: 'Carry awards', group: 'Carry', description: 'Inspect award timing and projected distributions.' },
] as const;
export type Analysis = typeof analyses[number]['id'];
export type Destination = 'overview' | 'plan' | 'explore' | 'report' | 'guide';
export const guideSections = ['overview', 'montecarlo', 'returns', 'assets', 'taxes', 'socialsecurity', 'spending', 'carry', 'college', 'liabilities', 'charts', 'metrics', 'limitations'] as const;
export type GuideSection = typeof guideSections[number];
export interface AppRoute { destination: Destination; analysis: Analysis; section?: GuideSection }

export function parseRoute(hash: string): AppRoute {
  const [destination, analysis] = hash.replace(/^#\/?/, '').split('/');
  const validAnalysis = analyses.some(item => item.id === analysis) ? analysis as Analysis : 'rich';
  if (destination === 'explore') return { destination, analysis: validAnalysis };
  if (destination === 'guide') return { destination, analysis: 'rich', ...(guideSections.includes(analysis as GuideSection) ? { section: analysis as GuideSection } : {}) };
  if (destination === 'plan' || destination === 'report' || destination === 'overview') return { destination, analysis: 'rich' };
  if (destination === 'summary') return { destination: 'report', analysis: 'rich' };
  if (destination === 'info') return { destination: 'guide', analysis: 'rich' };
  if (analyses.some(item => item.id === destination)) return { destination: 'explore', analysis: destination as Analysis };
  return { destination: 'overview', analysis: 'rich' };
}

export function routeHash(route: AppRoute): string {
  if (route.destination === 'guide' && route.section) return `#guide/${route.section}`;
  return route.destination === 'explore' ? `#explore/${route.analysis}` : `#${route.destination}`;
}
