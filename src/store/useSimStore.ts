import { create } from "zustand";
import { runSimulation } from "../engine/monteCarlo";
import { DEFAULT_INPUTS } from "../lib/constants";
import type { InputErrors, LumpyEvent, Scenario, SimInputs, SimResults } from "../types";

interface SimStore {
  inputs: SimInputs;
  results: SimResults | null;
  scenarios: Scenario[];
  isRunning: boolean;
  errors: InputErrors;
  setInput: <K extends keyof SimInputs>(key: K, value: SimInputs[K]) => void;
  setInputs: (inputs: Partial<SimInputs>) => void;
  runSimulation: () => void;
  addScenario: (scenario: Scenario) => void;
  addLumpyEvent: (event: LumpyEvent) => void;
  updateLumpyEvent: (event: LumpyEvent) => void;
  removeLumpyEvent: (id: string) => void;
}

let debounceTimer: number | null = null;

export function validateInputs(inputs: SimInputs): InputErrors {
  const errors: InputErrors = {};
  const dollarKeys: Array<keyof SimInputs> = [
    "taxableAssets", "taxDeferredAssets", "taxFreeAssets", "illiquidAssets", "cashReserves",
    "annualSalary", "spouseAnnualSalary", "socialSecurityAmount", "spouseSocialSecurityAmount",
    "otherRetirementIncome", "spendingGoGo", "spendingSlowGo", "spendingNoGo", "healthcareSurgeAmount",
    "mortgageBalance", "mortgageAnnualPayment", "capitalCallObligations",
  ];

  if (inputs.currentAge < 18 || inputs.currentAge > 80) errors.currentAge = "Current age must be 18-80.";
  if (inputs.currentAge >= inputs.retirementAge) errors.currentAge = "Current age must be before retirement age.";
  if (inputs.retirementAge <= inputs.currentAge || inputs.retirementAge >= inputs.planningAge) errors.retirementAge = "Retirement age must be after current age and before planning age.";
  if (inputs.planningAge < 70 || inputs.planningAge > 100) errors.planningAge = "Planning age must be 70-100.";
  if (inputs.expectedReturn < 0.01 || inputs.expectedReturn > 0.2) errors.expectedReturn = "Expected return must be 1%-20%.";
  if (inputs.volatility < 0.01 || inputs.volatility > 0.4) errors.volatility = "Volatility must be 1%-40%.";
  if (inputs.inflationRate < 0 || inputs.inflationRate > 0.15) errors.inflationRate = "Inflation must be 0%-15%.";
  if (inputs.numSimulations < 100 || inputs.numSimulations > 5000) errors.numSimulations = "Simulations must be 100-5000.";

  dollarKeys.forEach((key) => {
    const value = inputs[key];
    if (typeof value === "number" && value < 0) errors[key] = "Value must be $0 or greater.";
  });

  return errors;
}

function hasErrors(errors: InputErrors): boolean {
  return Object.keys(errors).length > 0;
}

function scheduleRun(get: () => SimStore, set: (partial: Partial<SimStore>) => void) {
  const errors = validateInputs(get().inputs);
  set({ errors });
  if (hasErrors(errors)) {
    set({ isRunning: false });
    return;
  }

  set({ isRunning: true });
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    set({ results: runSimulation(get().inputs), isRunning: false });
  }, 400);
}

export const useSimStore = create<SimStore>((set, get) => {
  const initialErrors = validateInputs(DEFAULT_INPUTS);
  return {
    inputs: DEFAULT_INPUTS,
    results: hasErrors(initialErrors) ? null : runSimulation(DEFAULT_INPUTS),
    scenarios: [],
    isRunning: false,
    errors: initialErrors,
    setInput: (key, value) => {
      set((state) => ({ inputs: { ...state.inputs, [key]: value } }));
      scheduleRun(get, set);
    },
    setInputs: (nextInputs) => {
      set((state) => ({ inputs: { ...state.inputs, ...nextInputs } }));
      scheduleRun(get, set);
    },
  };
});
