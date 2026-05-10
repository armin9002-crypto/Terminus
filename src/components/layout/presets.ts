export const PRESETS = [
  {
    id: 'pe-partner',
    name: 'PE Partner',
    emoji: '💼',
    description: 'Age 47, retiring at 55, complex asset mix',
    inputs: {
      currentAge: 47, retirementAge: 55, planningAge: 92,
      taxableAssets: 2500000, taxDeferredAssets: 800000,
      taxFreeAssets: 200000, illiquidAssets: 1500000,
      cashReserves: 150000, spendingGoGo: 280000,
      spendingSlowGo: 210000, spendingNoGo: 160000,
      expectedReturn: 0.07, volatility: 0.15, inflationRate: 0.028,
      numSimulations: 1000, lumpyEvents: [{
        id: '1', label: 'Carry Distribution',
        amount: 1500000, year: 52,
        probability: 0.7, confidence: 'medium' as const, taxType: 'ltcg' as const
      }],
      collegeEvents: [], hasSpouse: false,
      mortgageBalance: 0, mortgageAnnualPayment: 0, mortgageYearsRemaining: 0,
      capitalCallObligations: 0, numKids: 0, otherRetirementIncome: 0,
      socialSecurityAmount: 48000, socialSecurityAge: 67
    }
  },
  {
    id: 'early-retiree',
    name: 'Early Retiree',
    emoji: '🏖️',
    description: 'Age 38, FIRE at 45, lean spending',
    inputs: {
      currentAge: 38, retirementAge: 45, planningAge: 95,
      taxableAssets: 800000, taxDeferredAssets: 400000,
      taxFreeAssets: 300000, illiquidAssets: 0,
      cashReserves: 50000, spendingGoGo: 80000, 
      spendingSlowGo: 65000, spendingNoGo: 50000,
      expectedReturn: 0.07, volatility: 0.15, inflationRate: 0.028,
      numSimulations: 1000, lumpyEvents: [], collegeEvents: [],
      hasSpouse: false, mortgageBalance: 0, mortgageAnnualPayment: 0,
      mortgageYearsRemaining: 0, capitalCallObligations: 0, numKids: 0,
      otherRetirementIncome: 0, socialSecurityAmount: 0, socialSecurityAge: 67
    }
  }
];