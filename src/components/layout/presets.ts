import type { SimInputs } from "../../types";

export interface Preset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  inputs: Partial<SimInputs>;
}

export const PRESETS: Preset[] = [
  {
    id: 'pe-partner',
    name: 'PE Partner',
    emoji: '💼',
    description: 'Age 47, retiring at 55, complex asset mix',
    inputs: {
      currentAge: 47,
      retirementAge: 55,
      planningAge: 92,
      taxableAssets: 2500000,
      taxDeferredAssets: 800000,
      taxFreeAssets: 200000,
      illiquidAssets: 1500000,
      cashReserves: 150000,
      spendingGoGo: 280000,
      spendingSlowGo: 210000,
      spendingNoGo: 160000,
      expectedReturn: 0.07,
      volatility: 0.15,
      inflationRate: 0.028
    }
  },
  {
    id: 'early-retiree',
    name: 'Early Retiree',
    emoji: '🏖️',
    description: 'Age 38, FIRE at 45, lean spending',
    inputs: {
      currentAge: 38,
      retirementAge: 45,
      planningAge: 95,
      taxableAssets: 800000,
      taxDeferredAssets: 400000,
      taxFreeAssets: 300000,
      illiquidAssets: 0,
      spendingGoGo: 80000,
      spendingSlowGo: 65000,
      spendingNoGo: 50000,
      expectedReturn: 0.07,
      volatility: 0.15,
      inflationRate: 0.028
    }
  },
  {
    id: 'dual-income',
    name: 'Dual Income',
    emoji: '👫',
    description: 'Two earners, retiring together at 60',
    inputs: {
      currentAge: 52, retirementAge: 60, planningAge: 92,
      hasSpouse: true, spouseCurrentAge: 49, spouseRetirementAge: 60,
      taxableAssets: 1800000, taxDeferredAssets: 1200000,
      taxFreeAssets: 400000, illiquidAssets: 300000,
      spendingGoGo: 200000, spendingSlowGo: 155000, spendingNoGo: 120000,
      expectedReturn: 0.07, volatility: 0.15, inflationRate: 0.028
    }
  },
  {
    id: 'conservative',
    name: 'Conservative',
    emoji: '🛡️',
    description: 'Age 58, retiring at 65, low risk tolerance',
    inputs: {
      currentAge: 58, retirementAge: 65, planningAge: 90,
      taxableAssets: 1200000, taxDeferredAssets: 900000,
      taxFreeAssets: 150000, illiquidAssets: 0,
      spendingGoGo: 120000, spendingSlowGo: 95000, spendingNoGo: 80000,
      expectedReturn: 0.055, volatility: 0.10, inflationRate: 0.028
    }
  }
];