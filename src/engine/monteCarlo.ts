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

// SS Full Retirement Age (FRA) for those born 1960 or later = 67
// Early claiming at 62: benefit reduced by ~30%
// Delayed credits: +8% per year from FRA up to age 70
// SS trust fund: projected ~21% cut around 2033-2035 if 
// Congress doesn't act — apply a 15% haircut as base assumption
// to be conservative

const SS_FRA = 67;
const SS_TRUST_FUND_HAIRCUT = 0.85; // 15% reduction for uncertainty

function getSocialSecurityClaimingFactor(claimingAge: number): number {
  if (claimingAge <= 62) return 0.70;  // max reduction at 62
  if (claimingAge >= 70) return 1.24;  // max benefit at 70
  if (claimingAge < SS_FRA) {
    // Reduction: ~6.67% per year before FRA for first 3 years,
    // ~5% per year for additional years
    const yearsEarly = SS_FRA - claimingAge;
    if (yearsEarly <= 3) return 1 - (yearsEarly * 0.0667);
    return 1 - (3 * 0.0667) - ((yearsEarly - 3) * 0.05);
  }
  // Delayed credits: 8% per year after FRA
  const yearsLate = claimingAge - SS_FRA;
  return 1 + (yearsLate * 0.08);
}

function socialSecurityIncome(age: number, inputs: SimInputs): number {
  if (age < inputs.retirementAge) return 0;
  
  let income = 0;
  
  // Primary SS
  if (age >= inputs.socialSecurityAge) {
    const claimingFactor = getSocialSecurityClaimingFactor(inputs.socialSecurityAge);
    // Inflation adjust from SS claiming age, not from currentAge
    const yearsOfInflation = Math.max(0, age - inputs.socialSecurityAge);
    income += inputs.socialSecurityAmount * claimingFactor * SS_TRUST_FUND_HAIRCUT * Math.pow(1 + inputs.inflationRate, yearsOfInflation);
  }
  
  // Spouse SS
  if (inputs.hasSpouse && age >= inputs.spouseSocialSecurityAge) {
    const spouseClaimingFactor = getSocialSecurityClaimingFactor(inputs.spouseSocialSecurityAge);
    const yearsOfInflation = Math.max(0, age - inputs.spouseSocialSecurityAge);
    income += inputs.spouseSocialSecurityAmount * spouseClaimingFactor * SS_TRUST_FUND_HAIRCUT * Math.pow(1 + inputs.inflationRate, yearsOfInflation);
  }
  
  return income;
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
    survival *= 1 - (SSA_MORTALITY_QX[age] ?? 0.0);
  }
  return (1 - survival) * 100;
}

interface TaxResult {
  federalTax: number;
  stateTax: number;
  ficaTax: number;
  totalTax: number;
  effectiveRate: number;
  afterTaxIncome: number;
}

function calculateTaxes(
  grossIncome: number, 
  inputs: SimInputs,
  isRetired: boolean
): TaxResult {
  const isMFJ = inputs.filingStatus === 'mfj';
  
  // Pre-tax deductions (401k etc) - only during working years
  const preTaxDeductions = isRetired 
    ? 0 
    : grossIncome * inputs.preTaxSavingsRate;
  const taxableIncome = Math.max(0, grossIncome - preTaxDeductions);
  
  // 2024 Standard deduction
  const standardDeduction = isMFJ ? 29200 : 14600;
  // Child tax credit (not deduction but reduces tax)
  const childTaxCredit = Math.min(inputs.numDependents, 3) * 2000;
  
  const agi = Math.max(0, taxableIncome - standardDeduction);
  
  // 2024 Federal brackets MFJ
  let federalTax = 0;
  if (isMFJ) {
    if (agi <= 23200) federalTax = agi * 0.10;
    else if (agi <= 94300) federalTax = 2320 + (agi - 23200) * 0.12;
    else if (agi <= 201050) federalTax = 10838 + (agi - 94300) * 0.22;
    else if (agi <= 383900) federalTax = 34337 + (agi - 201050) * 0.24;
    else if (agi <= 487450) federalTax = 78221 + (agi - 383900) * 0.32;
    else if (agi <= 731200) federalTax = 111357 + (agi - 487450) * 0.35;
    else federalTax = 196669 + (agi - 731200) * 0.37;
  } else {
    if (agi <= 11600) federalTax = agi * 0.10;
    else if (agi <= 47150) federalTax = 1160 + (agi - 11600) * 0.12;
    else if (agi <= 100525) federalTax = 5426 + (agi - 47150) * 0.22;
    else if (agi <= 191950) federalTax = 17168 + (agi - 100525) * 0.24;
    else if (agi <= 243725) federalTax = 39110 + (agi - 191950) * 0.32;
    else if (agi <= 609350) federalTax = 55678 + (agi - 243725) * 0.35;
    else federalTax = 183647 + (agi - 609350) * 0.37;
  }
  
  // Apply child tax credit (phase out above $400K MFJ)
  const creditPhaseOut = isMFJ 
    ? Math.max(0, (agi - 400000) / 1000) * 50
    : Math.max(0, (agi - 200000) / 1000) * 50;
  const effectiveChildCredit = Math.max(
    0, childTaxCredit - creditPhaseOut
  );
  federalTax = Math.max(0, federalTax - effectiveChildCredit);
  
  // FICA (Social Security 6.2% up to $168,600 + Medicare 1.45%)
  // Additional Medicare 0.9% above $200K (MFJ $250K)
  const ficaThreshold = 168600;
  const ficaSS = Math.min(grossIncome, ficaThreshold) * 0.062;
  const ficaMedicare = grossIncome * 0.0145;
  const additionalMedicareThreshold = isMFJ ? 250000 : 200000;
  const additionalMedicare = Math.max(
    0, grossIncome - additionalMedicareThreshold
  ) * 0.009;
  // FICA only applies during working years
  const ficaTax = isRetired 
    ? 0 
    : ficaSS + ficaMedicare + additionalMedicare;
  
  // State income tax (flat rate approximation)
  const stateTax = taxableIncome * inputs.stateIncomeTaxRate;
  
  const totalTax = federalTax + ficaTax + stateTax;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;
  const afterTaxIncome = Math.max(0, grossIncome - totalTax);
  
  return { 
    federalTax, stateTax, ficaTax, 
    totalTax, effectiveRate, afterTaxIncome 
  };
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
    
    const total = paths.length;
    const brokeCount = values.filter(v => v <= 0).length;
    const strugglingCount = values.filter(v => v > 0 && v <= startingAssets * 0.5).length;
    const survivingCount = values.filter(v => v > startingAssets * 0.5 && v <= startingAssets).length;
    const thrivingCount = values.filter(v => v > startingAssets && v <= startingAssets * 2).length;
    const flourishingCount = values.filter(v => v > startingAssets * 2).length;

    const dead = age >= retirementAge ? getCumulativeMortality(retirementAge, age) : 0;
    const livingPct = Math.max(0, 100 - dead);

    const livingTotal = brokeCount + strugglingCount + survivingCount + thrivingCount + flourishingCount;
    const scale = livingTotal > 0 ? livingPct / 100 : 0;

    return {
      age,
      broke: (brokeCount / total) * 100 * scale,
      struggling: (strugglingCount / total) * 100 * scale,
      surviving: (survivingCount / total) * 100 * scale,
      thriving: (thrivingCount / total) * 100 * scale,
      flourishing: (flourishingCount / total) * 100 * scale,
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
        
        const isRetired = age >= inputs.retirementAge;
        const taxResult = calculateTaxes(
          annualGrossIncome, inputs, isRetired
        );
        // During working years: save a % of after-tax income
        const afterTaxSpendable = taxResult.afterTaxIncome;
        const savedAmount = isRetired 
          ? afterTaxSpendable  // in retirement, all income supplements wealth
          : afterTaxSpendable * inputs.afterTaxSavingsRate;
        
        wealth += isRetired ? afterTaxSpendable : savedAmount;
        
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
