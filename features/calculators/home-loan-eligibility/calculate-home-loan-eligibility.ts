import { calculateMaxLoanAmount } from "@/features/calculators/emi/calculate-emi"
import { FOIR_BANDS, validateHomeLoanEligibilityInput } from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-schema"
import type {
  FOIRBand,
  FOIRBandComparisonRow,
  HomeLoanEligibilityInput,
  HomeLoanEligibilityResult,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-types"

function computeForBand(input: HomeLoanEligibilityInput, foirBand: FOIRBand): HomeLoanEligibilityResult {
  const { netMonthlyIncome, existingMonthlyEMI, annualInterestRate, tenureYears, ownContribution } = input
  const foirPercentage = FOIR_BANDS[foirBand]
  const foirBudget = (netMonthlyIncome * foirPercentage) / 100
  const rawEligibleEMI = foirBudget - existingMonthlyEMI
  const maxEligibleEMI = Math.max(0, rawEligibleEMI)
  const totalMonths = tenureYears * 12
  const monthlyInterestRate = annualInterestRate / 12 / 100
  const maxEligibleLoanAmount = calculateMaxLoanAmount(maxEligibleEMI, annualInterestRate, totalMonths)
  const totalPropertyAffordability = maxEligibleLoanAmount + ownContribution

  if (![foirBudget, maxEligibleEMI, maxEligibleLoanAmount, totalPropertyAffordability, monthlyInterestRate].every(Number.isFinite)) {
    throw new RangeError("Home loan eligibility calculation produced a non-finite result")
  }

  return {
    foirBand,
    foirPercentage,
    foirBudget,
    maxEligibleEMI,
    maxEligibleLoanAmount,
    totalPropertyAffordability,
    ownContribution,
    existingEMIExceedsBudget: rawEligibleEMI < 0,
    monthlyInterestRate,
    totalMonths,
  }
}

export function calculateHomeLoanEligibility(input: HomeLoanEligibilityInput): HomeLoanEligibilityResult {
  const validation = validateHomeLoanEligibilityInput(input)
  if (!validation.success) {
    throw new RangeError("Invalid Home Loan Eligibility input")
  }

  return computeForBand(input, input.foirBand)
}

/** Every FOIR band's result for the same inputs, used to render the "what would the other bands
 * give you" comparison without asking the visitor to re-enter their details three times. */
export function calculateFOIRBandComparison(input: HomeLoanEligibilityInput): readonly FOIRBandComparisonRow[] {
  const validation = validateHomeLoanEligibilityInput(input)
  if (!validation.success) {
    throw new RangeError("Invalid Home Loan Eligibility input")
  }

  return (["conservative", "standard", "aggressive"] as const).map((foirBand) => {
    const result = computeForBand(input, foirBand)
    return {
      foirBand: result.foirBand,
      foirPercentage: result.foirPercentage,
      maxEligibleEMI: result.maxEligibleEMI,
      maxEligibleLoanAmount: result.maxEligibleLoanAmount,
      totalPropertyAffordability: result.totalPropertyAffordability,
      existingEMIExceedsBudget: result.existingEMIExceedsBudget,
    }
  })
}
