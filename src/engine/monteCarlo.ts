import { SSA_MORTALITY_QX, CARRY_DISTRIBUTION_CURVE } from "../lib/constants";
import { formatCompactCurrency, formatPercentage } from "../lib/formatters";
import type { CarryAward, CollegeEvent, PercentilesAtAge, SimInputs, SimResults, StackedBandDataPoint, StressScenario } from "../types";
import { getSpendingForAge } from "./spendingSmile";

function randomNormal(): number {
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function logNormalReturn(mu: number, sigma: number): number {
  const z = randomNormal();
  return Math.exp(mu - 0.5 * sigma * sigma + sigma * z) - 1;
}

function percentile(values: number[], target: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((target / 100) * (sorted.length - 1))));
  return sorted[index] ?? 0;
}

// Federal-only rate estimates. State tax added dynamically from inputs.
const FEDERAL_LTCG_TAX_RATE = 0.20;
// LTCG add-on for net investment income tax (applies to high earners)
const NIIT_RATE = 0.038;

// Estimated federal marginal rate applied to IRA/401k withdrawals in retirement.
const ESTIMATED_RETIREMENT_ORDINARY_RATE = 0.22;

interface PortfolioBuckets {
  taxable: number;
  taxDeferred: number;
  taxFree: number;
  cash: number;
}

function totalPortfolio(buckets: PortfolioBuckets): number {
  return buckets.taxable + buckets.taxDeferred + buckets.taxFree + buckets.cash;
}

function applyPortfolioReturns(buckets: PortfolioBuckets, annualReturn: number, cashReturn: number): PortfolioBuckets {
  return {
    taxable: Math.max(0, buckets.taxable * (1 + annualReturn)),
    taxDeferred: Math.max(0, buckets.taxDeferred * (1 + annualReturn)),
    taxFree: Math.max(0, buckets.taxFree * (1 + annualReturn)),
    cash: Math.max(0, buckets.cash * (1 + cashReturn)),
  };
}

function drawFromBucket(balance: number, netNeeded: number, taxRate: number): { nextBalance: number; netCovered: number } {
  if (balance <= 0 || netNeeded <= 0) return { nextBalance: balance, netCovered: 0 };
  const afterTaxRate = Math.max(0.01, 1 - taxRate);
  const grossNeeded = netNeeded / afterTaxRate;
  const grossDraw = Math.min(balance, grossNeeded);
  return {
    nextBalance: balance - grossDraw,
    netCovered: grossDraw * afterTaxRate,
  };
}

function withdrawNetAmount(netAmount: number, buckets: PortfolioBuckets, inputs: SimInputs): PortfolioBuckets {
  let remaining = Math.max(0, netAmount);
  let next = { ...buckets };
  if (remaining <= 0 || totalPortfolio(next) <= 0) return next;

  const cashDraw = Math.min(next.cash, remaining);
  next.cash -= cashDraw;
  remaining -= cashDraw;

  const taxableRate = Math.min(FEDERAL_LTCG_TAX_RATE + NIIT_RATE + inputs.stateIncomeTaxRate, 0.55);
  const taxableDraw = drawFromBucket(next.taxable, remaining, taxableRate);
  next.taxable = taxableDraw.nextBalance;
  remaining -= taxableDraw.netCovered;

  const deferredRate = Math.min(ESTIMATED_RETIREMENT_ORDINARY_RATE + inputs.stateIncomeTaxRate, 0.55);
  const deferredDraw = drawFromBucket(next.taxDeferred, remaining, deferredRate);
  next.taxDeferred = deferredDraw.nextBalance;
  remaining -= deferredDraw.netCovered;

  const taxFreeDraw = Math.min(next.taxFree, remaining);
  next.taxFree -= taxFreeDraw;
  remaining -= taxFreeDraw;

  if (remaining > 0) {
    next = { taxable: 0, taxDeferred: 0, taxFree: 0, cash: 0 };
  }

  return next;
}

function collegeCashFlow(age: number, events: CollegeEvent[], inflationRate: number, currentAge: number): number {
  return events.reduce((total, event) => {
    const endAge = event.startYear + event.years;
    if (age < event.startYear || age >= endAge) return total;
    const inflatedCost = event.annualCost * Math.pow(1 + inflationRate, Math.max(0, age - currentAge));
    const annualSavingsOffset = Math.min(event.existingSavings529 / event.years, inflatedCost);
    return total - Math.max(0, inflatedCost - annualSavingsOffset);
  }, 0);
}

// Returns net carry distributions (after LTCG tax) and GP commit
// outflows separately so the withdrawal tax model can use them correctly.
function carryAwardCashFlows(
  calendarYear: number,
  awards: CarryAward[],
  inputs: SimInputs
): { netIncome: number; gpCommits: number } {
  let netIncome = 0;
  let gpCommits = 0;

  for (const award of awards) {
    const fundYear = calendarYear - award.vintageYear + 1;

    // GP commit: called straight-line over first 3 fund years
    if (fundYear >= 1 && fundYear <= 3) {
      gpCommits += (award.totalPoolValue * award.gpCommitPercent) / 3;
    }

    // Distribution: apply curve, capture discount, and vesting scalar
    if (fundYear >= 1 && fundYear <= 12) {
      const curvePct = CARRY_DISTRIBUTION_CURVE[fundYear - 1] ?? 0;
      if (curvePct > 0) {
        const gross =
          award.totalPoolValue *
          award.poolValueCapture *
          award.vestedPercent *
          curvePct;
        // Tax at LTCG + NIIT + state rate (carry is long-term capital gain)
        const taxRate = Math.min(
          FEDERAL_LTCG_TAX_RATE + NIIT_RATE + inputs.stateIncomeTaxRate,
          0.55
        );
        netIncome += gross * (1 - taxRate);
      }
    }
  }

  return { netIncome, gpCommits };
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
  const spouseAge = age - (inputs.currentAge - inputs.spouseCurrentAge);
  if (inputs.hasSpouse && spouseAge >= inputs.spouseSocialSecurityAge) {
    const spouseClaimingFactor = getSocialSecurityClaimingFactor(inputs.spouseSocialSecurityAge);
    const yearsOfInflation = Math.max(0, spouseAge - inputs.spouseSocialSecurityAge);
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
  for (let age = fromAge; age < toAge; age += 1) {
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
  
  // 2025 Standard deduction
  const standardDeduction = isMFJ ? 30000 : 15000;
  // Child tax credit (not deduction but reduces tax)
  const childTaxCredit = Math.min(inputs.numDependents, 3) * 2000;
  
  const agi = Math.max(0, taxableIncome - standardDeduction);
  
  // 2025 Federal brackets
  let federalTax = 0;
  if (isMFJ) {
    if (agi <= 23850) federalTax = agi * 0.10;
    else if (agi <= 96950) federalTax = 2385 + (agi - 23850) * 0.12;
    else if (agi <= 206700) federalTax = 11157 + (agi - 96950) * 0.22;
    else if (agi <= 394600) federalTax = 35302 + (agi - 206700) * 0.24;
    else if (agi <= 501050) federalTax = 80398 + (agi - 394600) * 0.32;
    else if (agi <= 751600) federalTax = 114462 + (agi - 501050) * 0.35;
    else federalTax = 202155 + (agi - 751600) * 0.37;
  } else {
    if (agi <= 11925) federalTax = agi * 0.10;
    else if (agi <= 48475) federalTax = 1193 + (agi - 11925) * 0.12;
    else if (agi <= 103350) federalTax = 5579 + (agi - 48475) * 0.22;
    else if (agi <= 197300) federalTax = 17651 + (agi - 103350) * 0.24;
    else if (agi <= 250525) federalTax = 40199 + (agi - 197300) * 0.32;
    else if (agi <= 626350) federalTax = 57231 + (agi - 250525) * 0.35;
    else federalTax = 188770 + (agi - 626350) * 0.37;
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
  const ficaThreshold = 176100;
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
    // Apply overrideReturn as a mean shift on the stochastic baseReturn.
    // This shifts the average return toward the stress scenario target
    // while preserving the full Monte Carlo variance across paths.
    const annualReturn = stressScenario.overrideReturn !== undefined
      ? baseReturn + (stressScenario.overrideReturn - inputs.expectedReturn)
      : baseReturn;
    return {
      annualReturn,
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
  inflationRate: number,
  currentAge: number,
): StackedBandDataPoint[] {
  const firstPath = paths[0];
  if (!firstPath) return [];

  return firstPath.map((_, index) => {
    const age = currentAge + index;
    const values = paths.map((path) => path[index] ?? 0);
    
    const total = paths.length;
    const yearsElapsed = age - currentAge;
    const realThreshold = startingAssets * Math.pow(1 + inflationRate, yearsElapsed);
    const brokeCount = values.filter(v => v <= 0).length;
    const strugglingCount = values.filter(v => v > 0 && v <= realThreshold * 0.5).length;
    const survivingCount = values.filter(v => v > realThreshold * 0.5 && v <= realThreshold).length;
    const thrivingCount = values.filter(v => v > realThreshold && v <= realThreshold * 2).length;
    const flourishingCount = values.filter(v => v > realThreshold * 2).length;

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
    let buckets: PortfolioBuckets = {
      taxable: Math.max(0, inputs.taxableAssets),
      taxDeferred: Math.max(0, inputs.taxDeferredAssets),
      taxFree: Math.max(0, inputs.taxFreeAssets),
      cash: Math.max(0, inputs.cashReserves),
    };
    let ruined = false;
    const path: number[] = [];
    const spendPath: number[] = [];

    for (let yearIndex = 0; yearIndex < horizon; yearIndex += 1) {
      const age = inputs.currentAge + yearIndex;
      const calendarYear = inputs.simulationStartYear + yearIndex;
      const baseReturn = logNormalReturn(inputs.expectedReturn, inputs.volatility);
      const stressed = stressReturn(baseReturn, inputs, yearIndex, stressScenario);
      const spending = getSpendingForAge(age, inputs.retirementAge, { ...inputs, inflationRate: stressed.inflationRate });

      if (totalPortfolio(buckets) <= 0 && age >= inputs.retirementAge) {
        buckets = { taxable: 0, taxDeferred: 0, taxFree: 0, cash: 0 };
      } else {
        buckets = applyPortfolioReturns(buckets, stressed.annualReturn, stressed.inflationRate);
        
        // Calculate Gross Incomes
        let annualGrossIncome = salaryIncome(age, inputs.currentAge, inputs.retirementAge, inputs.annualSalary, inputs.inflationRate);
        annualGrossIncome += inputs.hasSpouse
          ? salaryIncome(
              age - (inputs.currentAge - inputs.spouseCurrentAge),
              inputs.spouseCurrentAge,
              inputs.spouseRetirementAge,
              inputs.spouseAnnualSalary,
              inputs.inflationRate
            )
          : 0;
        annualGrossIncome += socialSecurityIncome(age, inputs);
        annualGrossIncome += age >= inputs.retirementAge ? inputs.otherRetirementIncome * Math.pow(1 + inputs.inflationRate, age - inputs.retirementAge) : 0;
        
        const isRetired = age >= inputs.retirementAge;
        const taxResult = calculateTaxes(annualGrossIncome, inputs, isRetired);
        
        if (isRetired) {
          // In retirement: all after-tax income supplements the portfolio
          // (SS, pension, other income reduces portfolio withdrawals)
          buckets.cash += taxResult.afterTaxIncome;
        } else {
          // During accumulation:
          // 1. Pre-tax savings go directly to wealth pool (tax-deferred)
          const preTaxContributions = annualGrossIncome * inputs.preTaxSavingsRate;
          // 2. True take-home: gross minus pre-tax contributions minus all taxes
          const trueAfterTaxTakeHome = Math.max(0, taxResult.afterTaxIncome - preTaxContributions);
          // 3. After-tax savings from actual take-home
          const afterTaxSaved = trueAfterTaxTakeHome * inputs.afterTaxSavingsRate;
          buckets.taxDeferred += preTaxContributions;
          buckets.taxable += afterTaxSaved;
        }

        const { netIncome: carryNetIncome, gpCommits: carryGPCommits } =
          carryAwardCashFlows(calendarYear, inputs.carryAwards, inputs);
        buckets.taxable += carryNetIncome;
        const collegeNetOutflow = Math.abs(Math.min(0, collegeCashFlow(age, inputs.collegeEvents, inputs.inflationRate, inputs.currentAge)));
        const capitalCalls = age < inputs.retirementAge ? inputs.capitalCallObligations : 0;
        const mortgage = yearIndex < inputs.mortgageYearsRemaining ? inputs.mortgageAnnualPayment : 0;
        const netOutflows = carryGPCommits + collegeNetOutflow + capitalCalls + mortgage + spending;
        buckets = withdrawNetAmount(netOutflows, buckets, inputs);
      }

      const wealth = totalPortfolio(buckets);
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
    stackedBands: computeStackedBands(paths, startingAssets, inputs.retirementAge, inputs.planningAge, inputs.inflationRate, inputs.currentAge),
    ruinProbability,
    medianTerminalWealth: percentile(terminalWealth, 50),
    successRate,
    verdictText: buildVerdict(inputs, successRate),
    yearlyMedianSpend: Array.from({ length: horizon }, (_, index) => percentile(spendPaths.map((path) => path[index] ?? 0), 50)),
  };
}

export function getAccumulationSummary(inputs: SimInputs): {
  yearsToRetirement: number;
  startingAssets: number;
  estimatedRetirementAssets: number;
  annualSavings: number;
  combinedGrossIncome: number;
  combinedNetIncome: number;
  preTaxSavings: number;
  afterTaxSavings: number;
  effectiveTaxRate: number;
} {
  const combinedGross = inputs.annualSalary + (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
  const taxResult = calculateTaxes(combinedGross, inputs, false);
  const preTaxSavings = combinedGross * inputs.preTaxSavingsRate;
  const afterTaxSavings = taxResult.afterTaxIncome * inputs.afterTaxSavingsRate;
  const totalAnnualSavings = preTaxSavings + afterTaxSavings;
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  
  // Simple compound growth estimate for display purposes
  const growthFactor = Math.pow(1 + inputs.expectedReturn, yearsToRetirement);
  const startingAssets = getInvestableAssets(inputs);
  
  // Future value of lump sum + future value of an annuity
  const estimatedRetirementAssets = 
    startingAssets * growthFactor + 
    totalAnnualSavings * ((growthFactor - 1) / inputs.expectedReturn);
  
  return {
    yearsToRetirement,
    startingAssets,
    estimatedRetirementAssets,
    annualSavings: totalAnnualSavings,
    combinedGrossIncome: combinedGross,
    combinedNetIncome: taxResult.afterTaxIncome,
    preTaxSavings,
    afterTaxSavings,
    effectiveTaxRate: taxResult.effectiveRate,
  };
}

export function solveSustainableSpend(inputs: SimInputs, targetSuccessRate = 0.85): number {
  let low = 25_000;
  let high = 750_000;
  const trialsPerPoint = 2;
  const simCount = Math.min(inputs.numSimulations, 400);
  for (let i = 0; i < 10; i += 1) {
    const mid = (low + high) / 2;
    const baseParams = {
      ...inputs,
      spendingGoGo: mid,
      spendingSlowGo: mid * 0.75,
      spendingNoGo: mid * 0.6,
      numSimulations: simCount,
    };
    let totalSuccess = 0;
    for (let t = 0; t < trialsPerPoint; t++) {
      totalSuccess += runSimulation(baseParams).successRate;
    }
    const avgSuccessRate = totalSuccess / trialsPerPoint;
    if (avgSuccessRate >= targetSuccessRate) low = mid;
    else high = mid;
  }
  return low / 12;
}

export function calculateSmartSpendingDefaults(
  inputs: SimInputs
): {
  goGo: number;
  slowGo: number;
  noGo: number;
  basis: string;
} {
  const combinedGross = inputs.annualSalary + 
    (inputs.hasSpouse ? inputs.spouseAnnualSalary : 0);
  const taxResult = calculateTaxes(combinedGross, inputs, false);
  // True spendable take-home: subtract pre-tax contributions from
  // afterTaxIncome, which currently includes 401k money in its base.
  const preTaxContributions = combinedGross * inputs.preTaxSavingsRate;
  const trueTakeHome = Math.max(0, taxResult.afterTaxIncome - preTaxContributions);
  
  const investable = getInvestableAssets(inputs);
  
  // Method A: 65% income replacement (of true spendable take-home)
  const incomeReplacementSpend = trueTakeHome * 0.65;
  
  // Method B: 4.5% of investable assets
  const assetBasedSpend = investable * 0.045;
  
  // Use the lower of the two, floored at $60K, capped at $500K
  const goGo = Math.max(60000, Math.min(500000,
    Math.min(incomeReplacementSpend, assetBasedSpend)
  ));
  
  // Round to nearest $5K for cleanliness
  const roundedGoGo = Math.round(goGo / 5000) * 5000;
  
  const basis = assetBasedSpend < incomeReplacementSpend
    ? 'asset-based (4.5% of investable)'
    : 'income-based (65% of net income)';
  
  return {
    goGo: roundedGoGo,
    slowGo: Math.round(roundedGoGo * 0.75 / 5000) * 5000,
    noGo: Math.round(roundedGoGo * 0.60 / 5000) * 5000,
    basis,
  };
}

export { getSpendingForAge } from "./spendingSmile";
