// Persistence: inputs auto-saved to localStorage on every change
// Users return to where they left off automatically
// Reset button clears saved state and restores defaults

import { create } from "zustand";
import { runSimulation, calculateSmartSpendingDefaults, solveSustainableSpend } from "../engine/monteCarlo";
import { DEFAULT_INPUTS } from "../lib/constants";
import type { CarryAward, InputErrors, Scenario, SimInputs, SimResults } from "../types";

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
  addCarryAward: (award: CarryAward) => void;
  updateCarryAward: (award: CarryAward) => void;
  removeCarryAward: (id: string) => void;
  resetInputs: () => void;
  applySmartSpendingDefaults: () => void;
}

const STORAGE_KEY = 'terminus-inputs-v2';

function loadSavedInputs(): SimInputs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_INPUTS;
    const parsed = JSON.parse(saved);
    // Merge with defaults to handle new fields added in updates
    return {
      ...DEFAULT_INPUTS,
      ...parsed,
      carryAwards: Array.isArray(parsed.carryAwards) ? parsed.carryAwards : DEFAULT_INPUTS.carryAwards,
      collegeEvents: Array.isArray(parsed.collegeEvents) ? parsed.collegeEvents : DEFAULT_INPUTS.collegeEvents,
    };
  } catch {
    return DEFAULT_INPUTS;
  }
}

function saveInputs(inputs: SimInputs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    // Storage full or unavailable -- fail silently
  }
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

  if (!Number.isFinite(inputs.currentAge) || inputs.currentAge < 18 || inputs.currentAge > 80) errors.currentAge = "Current age must be 18-80.";
  if (inputs.currentAge >= inputs.retirementAge) errors.currentAge = "Current age must be before retirement age.";
  if (!Number.isFinite(inputs.retirementAge) || inputs.retirementAge <= inputs.currentAge || inputs.retirementAge >= inputs.planningAge) errors.retirementAge = "Retirement age must be after current age and before planning age.";
  if (!Number.isFinite(inputs.planningAge) || inputs.planningAge < 70 || inputs.planningAge > 100) errors.planningAge = "Planning age must be 70-100.";
  if (inputs.hasSpouse) {
    if (!Number.isFinite(inputs.spouseCurrentAge) || inputs.spouseCurrentAge < 18 || inputs.spouseCurrentAge > 80) errors.spouseCurrentAge = "Spouse age must be 18-80.";
    if (!Number.isFinite(inputs.spouseRetirementAge) || inputs.spouseRetirementAge <= inputs.spouseCurrentAge || inputs.spouseRetirementAge >= inputs.spousePlanningAge) errors.spouseRetirementAge = "Spouse retirement age must be after spouse age and before planning age.";
    if (!Number.isFinite(inputs.spousePlanningAge) || inputs.spousePlanningAge < 70 || inputs.spousePlanningAge > 105) errors.spousePlanningAge = "Spouse planning age must be 70-105.";
  }
  if (!Number.isFinite(inputs.socialSecurityAge) || inputs.socialSecurityAge < 62 || inputs.socialSecurityAge > 70) errors.socialSecurityAge = "Social Security age must be 62-70.";
  if (inputs.hasSpouse && (!Number.isFinite(inputs.spouseSocialSecurityAge) || inputs.spouseSocialSecurityAge < 62 || inputs.spouseSocialSecurityAge > 70)) errors.spouseSocialSecurityAge = "Spouse Social Security age must be 62-70.";
  if (!Number.isFinite(inputs.expectedReturn) || inputs.expectedReturn < 0.01 || inputs.expectedReturn > 0.2) errors.expectedReturn = "Expected return must be 1%-20%.";
  if (!Number.isFinite(inputs.volatility) || inputs.volatility < 0.01 || inputs.volatility > 0.4) errors.volatility = "Volatility must be 1%-40%.";
  if (!Number.isFinite(inputs.inflationRate) || inputs.inflationRate < 0 || inputs.inflationRate > 0.15) errors.inflationRate = "Inflation must be 0%-15%.";
  if (!Number.isFinite(inputs.numSimulations) || inputs.numSimulations < 100 || inputs.numSimulations > 5000) errors.numSimulations = "Simulations must be 100-5000.";
  if (!Number.isFinite(inputs.stateIncomeTaxRate) || inputs.stateIncomeTaxRate < 0 || inputs.stateIncomeTaxRate > 0.2) errors.stateIncomeTaxRate = "State tax rate must be 0%-20%.";
  if (!Number.isFinite(inputs.preTaxSavingsRate) || inputs.preTaxSavingsRate < 0 || inputs.preTaxSavingsRate > 1) errors.preTaxSavingsRate = "Pre-tax savings rate must be 0%-100%.";
  if (!Number.isFinite(inputs.afterTaxSavingsRate) || inputs.afterTaxSavingsRate < 0 || inputs.afterTaxSavingsRate > 1) errors.afterTaxSavingsRate = "After-tax savings rate must be 0%-100%.";
  if (!Number.isFinite(inputs.numDependents) || inputs.numDependents < 0 || inputs.numDependents > 10) errors.numDependents = "Dependents must be 0-10.";
  if (!Number.isFinite(inputs.simulationStartYear) || inputs.simulationStartYear < 2000 || inputs.simulationStartYear > 2100) errors.simulationStartYear = "Simulation start year must be 2000-2100.";
  if (!Number.isFinite(inputs.goGoYears) || inputs.goGoYears < 1 || inputs.goGoYears > 30) errors.goGoYears = "Go-go years must be 1-30.";
  if (!Number.isFinite(inputs.slowGoYears) || inputs.slowGoYears < 0 || inputs.slowGoYears > 30) errors.slowGoYears = "Slow-go years must be 0-30.";
  if (!Number.isFinite(inputs.mortgageYearsRemaining) || inputs.mortgageYearsRemaining < 0 || inputs.mortgageYearsRemaining > 50) errors.mortgageYearsRemaining = "Mortgage years must be 0-50.";

  dollarKeys.forEach((key) => {
    const value = inputs[key];
    if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) errors[key] = "Value must be $0 or greater.";
  });

  if (inputs.carryAwards.some((award) => (
    !Number.isFinite(award.vintageYear) ||
    !Number.isFinite(award.totalPoolValue) ||
    !Number.isFinite(award.poolValueCapture) ||
    !Number.isFinite(award.vestedPercent) ||
    !Number.isFinite(award.gpCommitPercent) ||
    award.vintageYear < 2000 ||
    award.vintageYear > 2100 ||
    award.totalPoolValue < 0 ||
    award.poolValueCapture < 0 ||
    award.poolValueCapture > 1 ||
    award.vestedPercent < 0 ||
    award.vestedPercent > 1 ||
    award.gpCommitPercent < 0 ||
    award.gpCommitPercent > 1
  ))) {
    errors.carryAwards = "Carry awards need valid years, non-negative values, and percentages between 0%-100%.";
  }

  if (inputs.collegeEvents.some((event) => (
    !Number.isFinite(event.startYear) ||
    !Number.isFinite(event.annualCost) ||
    !Number.isFinite(event.years) ||
    !Number.isFinite(event.existingSavings529) ||
    event.startYear < inputs.currentAge ||
    event.startYear > 100 ||
    event.annualCost < 0 ||
    event.years < 0 ||
    event.years > 8 ||
    event.existingSavings529 < 0
  ))) {
    errors.collegeEvents = "College entries need valid ages, non-negative values, and 0-8 funding years.";
  }

  return errors;
}

function hasErrors(errors: InputErrors): boolean {
  return Object.keys(errors).length > 0;
}

function scheduleRun(get: () => SimStore, set: (partial: Partial<SimStore>) => void) {
  const errors = validateInputs(get().inputs);
  set({ errors });
  if (hasErrors(errors)) {
    if (debounceTimer) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    set({ isRunning: false });
    return;
  }

  set({ isRunning: true });
  saveInputs(get().inputs);
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    set({ results: runSimulation(get().inputs), isRunning: false });
  }, 400);
}

export const useSimStore = create<SimStore>((set, get) => {
  const initialInputs = loadSavedInputs();
  const initialErrors = validateInputs(initialInputs);
  return {
    inputs: initialInputs,
    results: hasErrors(initialErrors) ? null : runSimulation(initialInputs),
    scenarios: [] as Scenario[],
    isRunning: false,
    errors: initialErrors,
    setInput: <K extends keyof SimInputs>(key: K, value: SimInputs[K]) => {
      set((state) => ({ inputs: { ...state.inputs, [key]: value } }));
      scheduleRun(get, set);
    },
    setInputs: (nextInputs: Partial<SimInputs>) => {
      set((state) => ({ inputs: { ...state.inputs, ...nextInputs } }));
      scheduleRun(get, set);
    },
    runSimulation: () => {
      const currentInputs = get().inputs;
      const validationErrors = validateInputs(currentInputs);
      if (hasErrors(validationErrors)) {
        set({ errors: validationErrors, isRunning: false });
        return;
      }
      set({ errors: validationErrors, isRunning: true });
      set({ results: runSimulation(currentInputs), isRunning: false });
    },
    addScenario: (scenario) => set((state) => ({ scenarios: [...state.scenarios, scenario] })),
    addCarryAward: (award) => {
      set((state) => ({
        inputs: { ...state.inputs, carryAwards: [...state.inputs.carryAwards, award] },
      }));
      scheduleRun(get, set);
    },
    updateCarryAward: (award) => {
      set((state) => ({
        inputs: {
          ...state.inputs,
          carryAwards: state.inputs.carryAwards.map((a) => (a.id === award.id ? award : a)),
        },
      }));
      scheduleRun(get, set);
    },
    removeCarryAward: (id) => {
      set((state) => ({
        inputs: {
          ...state.inputs,
          carryAwards: state.inputs.carryAwards.filter((a) => a.id !== id),
        },
      }));
      scheduleRun(get, set);
    },
    resetInputs: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ inputs: DEFAULT_INPUTS });
      scheduleRun(get, set);
    },
    applySmartSpendingDefaults: () => {
      const inputs = get().inputs;
      const defaults = calculateSmartSpendingDefaults(inputs);
      const sustainableMonthly = solveSustainableSpend({
        ...inputs,
        numSimulations: Math.min(inputs.numSimulations, 600),
      });
      const sustainableAnnual = sustainableMonthly * 12;
      const goGo = Number.isFinite(sustainableAnnual) && sustainableAnnual >= 60_000
        ? Math.min(500_000, sustainableAnnual)
        : defaults.goGo;
      const roundedGoGo = Math.round(goGo / 5_000) * 5_000;
      set((state) => ({
        inputs: {
          ...state.inputs,
          spendingGoGo: roundedGoGo,
          spendingSlowGo: Math.round(roundedGoGo * 0.75 / 5_000) * 5_000,
          spendingNoGo: Math.round(roundedGoGo * 0.60 / 5_000) * 5_000,
        }
      }));
      scheduleRun(get, set);
    }
  };
});
