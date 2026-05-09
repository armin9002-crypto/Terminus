import type { CollegeEvent, LumpyEvent, PercentilesAtAge, SimInputs, SimResults } from "@/types";
import { formatCompactCurrency, formatPercentage } from "@/lib/formatters";
import { getSpendingForAge } from "./spendingSmile";

function randomNormal(): number {
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function logNormalReturn(expectedReturn: number, volatility: number): number {
  const z = randomNormal();
  return Math.exp(Math.log(1 + expectedReturn) - (volatility ** 2) / 2 + volatility * z) - 1;
}

function percentile(values: number[], target: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (target / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);

  if (lower === upper) {
    return sorted[lower] ?? 0;
  }

  const weight = rank - lower;
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
}

function taxableEventAmount(event: LumpyEvent): number {
  if (event.taxType === "ordinary") {
    return event.amount * 0.6;
  }

  if (event.taxType === "ltcg") {
    return event.amount * 0.76;
  }

  return event.amount;
}

function lumpyEventCashFlow(age: number, events: LumpyEvent[]): number {
  return events.reduce((total, event) => {
    if (event.year !== age || Math.random() > event.probability) {
      return total;
    }

    return total + taxableEventAmount(event);
  }, 0);
}

function collegeCashFlow(age: number, events: CollegeEvent[], inflationRate: number, currentAge: number): number {
  return events.reduce((total, event) => {
    const eventAgeEnd = event.startYear + event.years;
    if (age < event.startYear || age >= eventAgeEnd) {
      return total;
    }

    const yearIndex = age - event.startYear;
    const remainingSavings = Math.max(0, event.existingSavings529 - event.annualCost * yearIndex);
    const savingsOffset = yearIndex === 0 ? Math.min(remainingSavings, event.annualCost) : 0;
    const inflatedCost = event.annualCost * (1 + inflationRate) ** Math.max(0, age - currentAge);

    return total - Math.max(0, inflatedCost - savingsOffset);
  }, 0);
}

function activeSalary(age: number, currentAge: number, retirementAge: number, salary: number, inflationRate: number): number {
  if (age >= retirementAge) {
    return 0;
  }

  return salary * (1 + inflationRate) ** Math.max(0, age - currentAge);
}

function socialSecurityIncome(age: number, inputs: SimInputs): number {
  const primary = age >= inputs.socialSecurityAge ? inputs.socialSecurityAmount : 0;
  const spouse = inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge ? inputs.spouseSocialSecurityAmount : 0;
  const yearsFromNow = Math.max(0, age - inputs.currentAge);
  return (primary + spouse) * (1 + inputs.inflationRate) ** yearsFromNow;
}

function totalStartingWealth(inputs: SimInputs): number {
  return (
    inputs.taxableAssets +
    inputs.taxDeferredAssets +
    inputs.taxFreeAssets +
    inputs.illiquidAssets +
    inputs.cashReserves -
    inputs.mortgageBalance
  );
}

function buildVerdict(inputs: SimInputs, successRate: number): string {
  return `Based on your inputs, you can sustain ${formatCompactCurrency(
    inputs.spendingGoGo,
  )}/year with ${formatPercentage(successRate, 0)} confidence through age ${inputs.planningAge}`;
}

export function runSimulation(inputs: SimInputs): SimResults {
  const horizon = Math.max(1, inputs.planningAge - inputs.currentAge + 1);
  const paths: number[][] = [];
  const yearlySpendByPath: number[][] = [];
  let ruinedPaths = 0;

  for (let simulationIndex = 0; simulationIndex < inputs.numSimulations; simulationIndex += 1) {
    let wealth = Math.max(0, totalStartingWealth(inputs));
    let ruined = false;
    const path: number[] = [];
    const spendPath: number[] = [];

    for (let yearIndex = 0; yearIndex < horizon; yearIndex += 1) {
      const age = inputs.currentAge + yearIndex;
      const salary =
        activeSalary(age, inputs.currentAge, inputs.retirementAge, inputs.annualSalary, inputs.inflationRate) +
        (inputs.hasSpouse
          ? activeSalary(
              age,
              inputs.spouseCurrentAge,
              inputs.spouseRetirementAge,
              inputs.spouseAnnualSalary,
              inputs.inflationRate,
            )
          : 0);
      const capitalCalls = age < inputs.retirementAge ? inputs.capitalCallObligations : 0;
      const mortgage = yearIndex < inputs.mortgageYearsRemaining ? inputs.mortgageAnnualPayment : 0;
      const spending = getSpendingForAge(age, inputs.retirementAge, inputs);
      const socialSecurity = socialSecurityIncome(age, inputs);
      const lumpy = lumpyEventCashFlow(age, inputs.lumpyEvents);
      const college = collegeCashFlow(age, inputs.collegeEvents, inputs.inflationRate, inputs.currentAge);
      const annualReturn = logNormalReturn(inputs.expectedReturn, inputs.volatility);

      wealth = Math.max(0, wealth * (1 + annualReturn));
      wealth += salary + socialSecurity + lumpy + college;
      wealth -= capitalCalls + mortgage + spending;
      wealth = Math.max(0, wealth);

      if (!ruined && age >= inputs.retirementAge && wealth <= 0) {
        ruined = true;
      }

      path.push(wealth);
      spendPath.push(spending);
    }

    if (ruined) {
      ruinedPaths += 1;
    }

    paths.push(path);
    yearlySpendByPath.push(spendPath);
  }

  const percentilePaths: PercentilesAtAge[] = Array.from({ length: horizon }, (_, yearIndex) => {
    const values = paths.map((path) => path[yearIndex] ?? 0);
    return {
      age: inputs.currentAge + yearIndex,
      p10: percentile(values, 10),
      p25: percentile(values, 25),
      p50: percentile(values, 50),
      p75: percentile(values, 75),
      p90: percentile(values, 90),
    };
  });

  const yearlyMedianSpend = Array.from({ length: horizon }, (_, yearIndex) =>
    percentile(
      yearlySpendByPath.map((path) => path[yearIndex] ?? 0),
      50,
    ),
  );
  const terminalWealth = paths.map((path) => path[path.length - 1] ?? 0);
  const ruinProbability = ruinedPaths / inputs.numSimulations;
  const successRate = 1 - ruinProbability;
  const medianTerminalWealth = percentile(terminalWealth, 50);

  return {
    paths,
    percentilePaths,
    ruinProbability,
    medianTerminalWealth,
    successRate,
    verdictText: buildVerdict(inputs, successRate),
    yearlyMedianSpend,
  };
}

export { getSpendingForAge } from "./spendingSmile";
