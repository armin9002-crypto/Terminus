import type { SimInputs } from "../types";

export function getSpendingForAge(age: number, retirementAge: number, inputs: SimInputs): number {
  if (age < retirementAge) {
    return 0;
  }

  const retirementYearIndex = age - retirementAge;
  const inflationMultiplier = (1 + inputs.inflationRate) ** retirementYearIndex;

  if (retirementYearIndex < inputs.goGoYears) {
    return inputs.spendingGoGo * inflationMultiplier;
  }

  if (retirementYearIndex < inputs.goGoYears + inputs.slowGoYears) {
    return inputs.spendingSlowGo * inflationMultiplier;
  }

  return (inputs.spendingNoGo + inputs.healthcareSurgeAmount) * inflationMultiplier;
}

export function buildSpendingSmileSeries(inputs: SimInputs): Array<{ age: number; spending: number }> {
  return Array.from({ length: inputs.planningAge - inputs.currentAge + 1 }, (_, index) => {
    const age = inputs.currentAge + index;
    return {
      age,
      spending: getSpendingForAge(age, inputs.retirementAge, inputs),
    };
  });
}
