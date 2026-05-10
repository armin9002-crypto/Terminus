import { SSA_MORTALITY_QX } from "../lib/constants";
import { formatCompactCurrency, formatPercentage } from "../lib/formatters";
import type { CollegeEvent, LumpyEvent, PercentilesAtAge, SimInputs, SimResults, StackedBandDataPoint, StressScenario } from "../types";
import { getSpendingForAge } from "./spendingSmile";

function randomNormal(): number {
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function logNormalReturn(mu: number, sigma: number): number {
  const z = randomNormal();
  return Math.exp(mu - 0.5 * sigma ** 2 + sigma * z) - 1;
}

function percentile(values: number[], target: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((target / 100) * (sorted.length - 1))));
  return sorted[index] ?? 0;
}

// TODO: Move these to a central tax configuration or user inputs
const ESTIMATED_ORDINARY_TAX_RATE = 0.40;
const ESTIMATED_LTCG_TAX_RATE = 0.24;

function taxableEventAmount(event: LumpyEvent): number {
  if (event.taxType === "ordinary") return event.amount * (1 - ESTIMATED_ORDINARY_TAX_RATE);
  if (event.taxType === "ltcg") return event.amount * (1 - ESTIMATED_LTCG_TAX_RATE);
  return event.amount;
}

function lumpyEventCashFlow(age: number, events: LumpyEvent[]): number {
  return events.reduce((total, event) => {
    if (event.year !== age || Math.random() > event.probability) return total;
    return total + taxableEventAmount(event);
  }, 0);
}

function collegeCashFlow(age: number, events: CollegeEvent[], inflationRate: number, currentAge: number): number {
  return events.reduce((total, event) => {
    const endAge = event.startYear + event.years;
    if (age < event.startYear || age >= endAge) return total;
    const yearIndex = age - event.startYear;
    const inflatedCost = event.annualCost * Math.pow(1 + inflationRate, Math.max(0, age - currentAge));
    const savingsOffset = yearIndex === 0 ? Math.min(event.existingSavings529, inflatedCost) : 0;
    return total - Math.max(0, inflatedCost - savingsOffset);
  }, 0);
}

function salaryIncome(age: number, currentAge: number, retirementAge: number, salary: number, inflationRate: number): number {
  if (age >= retirementAge) return 0;
  return salary * Math.pow(1 + inflationRate, Math.max(0, age - currentAge));
}

function socialSecurityIncome(age: number, inputs: SimInputs): number {
  if (age < inputs.retirementAge) return 0;
  const primary = age >= inputs.socialSecurityAge ? inputs.socialSecurityAmount : 0;
  const spouse = inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge ? inputs.spouseSocialSecurityAmount : 0;
  return (primary + spouse) * Math.pow(1 + inputs.inflationRate, Math.max(0, age - inputs.currentAge));
}

export function getInvestableAssets(inputs: SimInputs): number {
  return inputs.taxableAssets + inputs.taxDeferredAssets + inputs.taxFreeAssets + inputs.cashReserves;
}

export function getTotalNetWorth(inputs: SimInputs): number {
  return getInvestableAssets(inputs) + inputs.illiquidAssets - inputs.mortgageBalance;
}

export function getCumulativeMortality(fromAge: number, toAge: number): number {
  let survival = 1;
  for (let age = fromAge; age <= toAge; age += 1) {
    survival *= 1 - (SSA_MORTALITY_QX[age] ?? 0.5);
  }
  return (1 - survival) * 100;
}

function stressReturn(baseReturn: number, inputs: SimInputs, yearIndex: number, stressScenario?: StressScenario): { annualReturn: number; inflationRate: number } {
  if (!stressScenario) return { annualReturn: baseReturn, inflationRate: inputs.inflationRate };
  if (yearIndex === 0 && stressScenario.yearOneReturn !== undefined) return { annualReturn: stressScenario.yearOneReturn, inflationRate: inputs.inflationRate };
  if (yearIndex === 1 && stressScenario.yearTwoReturn !== undefined) return { annualReturn: stressScenario.yearTwoReturn, inflationRate: inputs.inflationRate };
  if (yearIndex === 2 && stressScenario.yearThreeReturn !== undefined) return { annualReturn: stressScenario.yearThreeReturn, inflationRate: inputs.inflationRate };
  if (stressScenario.years !== undefined && yearIndex < stressScenario.years) {
    return {
      annualReturn: stressScenario.overrideReturn ?? baseReturn,
      inflationRate: stressScenario.overrideInflation ?? inputs.inflationRate,
    };
  }
  return { annualReturn: baseReturn, inflationRate: inputs.inflationRate };
}

export function computeStackedBands(
  paths: number[][],
  startingAssets: number,
  retirementAge: number,
  planningAge: number,
): StackedBandDataPoint[] {
  const firstPath = paths[0];
  if (!firstPath) return [];
  const currentAge = planningAge - firstPath.length + 1;

  return firstPath.map((_, index) => {
    const age = currentAge + index;
    const values = paths.map((path) => path[index] ?? 0);
    const dead = age >= retirementAge ? getCumulativeMortality(retirementAge, age) : 0;
    const aliveShare = Math.max(0, 100 - dead);
    const denominator = Math.max(1, paths.length);
    const brokeRaw = values.filter((value) => value <= 0).length / denominator;
    const strugglingRaw = values.filter((value) => value > 0 && value <= startingAssets * 0.5).length / denominator;
    const survivingRaw = values.filter((value) => value > startingAssets * 0.5 && value <= startingAssets).length / denominator;
    const thrivingRaw = values.filter((value) => value > startingAssets && value <= startingAssets * 2).length / denominator;
    const flourishingRaw = values.filter((value) => value > startingAssets * 2).length / denominator;

    return {
      age,
      broke: brokeRaw * aliveShare,
      struggling: strugglingRaw * aliveShare,
      surviving: survivingRaw * aliveShare,
      thriving: thrivingRaw * aliveShare,
      flourishing: flourishingRaw * aliveShare,
      dead,
      p10: percentile(values, 10),
      p25: percentile(values, 25),
      p50: percentile(values, 50),
      p75: percentile(values, 75),
      p90: percentile(values, 90),
    };
  });
}

function buildVerdict(inputs: SimInputs, successRate: number): string {
  return `Based on your inputs, you can sustain ${formatCompactCurrency(inputs.spendingGoGo)}/year with ${formatPercentage(successRate, 0)} confidence through age ${inputs.planningAge}`;
}

export function runSimulation(inputs: SimInputs, stressScenario?: StressScenario): SimResults {
  const horizon = Math.max(1, inputs.planningAge - inputs.currentAge + 1);
  const paths: number[][] = [];
  const spendPaths: number[][] = [];
  let ruinedPaths = 0;
  const startingAssets = getInvestableAssets(inputs);

  for (let simulationIndex = 0; simulationIndex < inputs.numSimulations; simulationIndex += 1) {
    let wealth = Math.max(0, startingAssets);
    let ruined = false;
    const path: number[] = [];
    const spendPath: number[] = [];

    for (let yearIndex = 0; yearIndex < horizon; yearIndex += 1) {
      const age = inputs.currentAge + yearIndex;
      const baseReturn = logNormalReturn(inputs.expectedReturn, inputs.volatility);
      const stressed = stressReturn(baseReturn, inputs, yearIndex, stressScenario);
      const spending = getSpendingForAge(age, inputs.retirementAge, { ...inputs, inflationRate: stressed.inflationRate });

      if (wealth <= 0) {
        wealth = 0;
      } else {
        wealth = Math.max(0, wealth * (1 + stressed.annualReturn));
        
        // Calculate Gross Incomes
        let annualGrossIncome = salaryIncome(age, inputs.currentAge, inputs.retirementAge, inputs.annualSalary, inputs.inflationRate);
        annualGrossIncome += inputs.hasSpouse
          ? salaryIncome(age, inputs.spouseCurrentAge, inputs.spouseRetirementAge, inputs.spouseAnnualSalary, inputs.inflationRate)
          : 0;
        annualGrossIncome += socialSecurityIncome(age, inputs);
        annualGrossIncome += age >= inputs.retirementAge ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, yearIndex) : 0;
        
        // Apply a basic tax estimate to income (assuming 25% effective rate for simplicity)
        wealth += annualGrossIncome * 0.75;
        
        wealth += lumpyEventCashFlow(age, inputs.lumpyEvents);
        wealth += collegeCashFlow(age, inputs.collegeEvents, inputs.inflationRate, inputs.currentAge);
        wealth -= age < inputs.retirementAge ? inputs.capitalCallObligations : 0;
        wealth -= yearIndex < inputs.mortgageYearsRemaining ? inputs.mortgageAnnualPayment : 0;
        wealth -= spending;
        wealth = Math.max(0, wealth);
      }

      if (!ruined && age >= inputs.retirementAge && wealth <= 0) ruined = true;
      path.push(wealth);
      spendPath.push(spending);
    }

    if (ruined) ruinedPaths += 1;
    paths.push(path);
    spendPaths.push(spendPath);
  }

  const percentilePaths: PercentilesAtAge[] = Array.from({ length: horizon }, (_, index) => {
    const values = paths.map((path) => path[index] ?? 0);
    return {
      age: inputs.currentAge + index,
      p10: percentile(values, 10),
      p25: percentile(values, 25),
      p50: percentile(values, 50),
      p75: percentile(values, 75),
      p90: percentile(values, 90),
    };
  });
  const terminalWealth = paths.map((path) => path[path.length - 1] ?? 0);
  const ruinProbability = ruinedPaths / inputs.numSimulations;
  const successRate = 1 - ruinProbability;

  return {
    paths,
    percentilePaths,
    stackedBands: computeStackedBands(paths, startingAssets, inputs.retirementAge, inputs.planningAge),
    ruinProbability,
    medianTerminalWealth: percentile(terminalWealth, 50),
    successRate,
    verdictText: buildVerdict(inputs, successRate),
    yearlyMedianSpend: Array.from({ length: horizon }, (_, index) => percentile(spendPaths.map((path) => path[index] ?? 0), 50)),
  };
}

export function solveSustainableSpend(inputs: SimInputs, targetSuccessRate = 0.85): number {
  let low = 25_000;
  let high = 750_000;
  for (let i = 0; i < 10; i += 1) {
    const mid = (low + high) / 2;
    const result = runSimulation({ ...inputs, spendingGoGo: mid, spendingSlowGo: mid * 0.75, spendingNoGo: mid * 0.6, numSimulations: Math.min(inputs.numSimulations, 500) });
    if (result.successRate >= targetSuccessRate) low = mid;
    else high = mid;
  }
  return low / 12;
}

export { getSpendingForAge } from "./spendingSmile";
