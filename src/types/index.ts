export interface SimInputs {
  currentAge: number;
  retirementAge: number;
  planningAge: number;
  hasSpouse: boolean;
  spouseCurrentAge: number;
  spouseRetirementAge: number;
  spousePlanningAge: number;
  taxableAssets: number;
  taxDeferredAssets: number;
  taxFreeAssets: number;
  illiquidAssets: number;
  cashReserves: number;
  annualSalary: number;
  spouseAnnualSalary: number;
  socialSecurityAge: number;
  socialSecurityAmount: number;
  spouseSocialSecurityAge: number;
  spouseSocialSecurityAmount: number;
  otherRetirementIncome: number;
  spendingGoGo: number;
  spendingSlowGo: number;
  spendingNoGo: number;
  goGoYears: number;
  slowGoYears: number;
  healthcareSurgeAmount: number;
  expectedReturn: number;
  volatility: number;
  inflationRate: number;
  numSimulations: number;
  carryAwards: CarryAward[];
  simulationStartYear: number;
  collegeEvents: CollegeEvent[];
  mortgageBalance: number;
  mortgageAnnualPayment: number;
  mortgageYearsRemaining: number;
  capitalCallObligations: number;
  filingStatus: 'mfj' | 'single';
  numDependents: number;
  stateIncomeTaxRate: number;
  preTaxSavingsRate: number;
  afterTaxSavingsRate: number;
}

export interface LumpyEvent {
  id: string;
  label: string;
  year: number;
  amount: number;
  probability: number;
  taxType: "ordinary" | "ltcg" | "none";
  confidence: "low" | "medium" | "high";
}

export interface CarryAward {
  id: string;
  label: string;
  vintageYear: number;
  totalPoolValue: number;
  poolValueCapture: number;
  vestedPercent: number;
  gpCommitPercent: number;
}

export interface CollegeEvent {
  id: string;
  childName: string;
  startYear: number;
  annualCost: number;
  years: number;
  existingSavings529: number;
}

export interface SimResults {
  paths: number[][];
  percentilePaths: PercentilesAtAge[];
  stackedBands: StackedBandDataPoint[];
  ruinProbability: number;
  medianTerminalWealth: number;
  successRate: number;
  verdictText: string;
  yearlyMedianSpend: number[];
}

export interface StackedBandDataPoint {
  age: number;
  broke: number;
  struggling: number;
  surviving: number;
  thriving: number;
  flourishing: number;
  dead: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export type InputErrors = Partial<Record<keyof SimInputs, string>>;

export interface StressScenario {
  key: string;
  label: string;
  yearOneReturn?: number;
  yearTwoReturn?: number;
  yearThreeReturn?: number;
  overrideInflation?: number;
  overrideReturn?: number;
  years?: number;
}

export interface PercentilesAtAge {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface Scenario {
  id: string;
  name: string;
  color: string;
  inputs: Partial<SimInputs>;
  results?: SimResults;
}
