import { validateEMIInput } from "@/features/calculators/emi/emi-schema"
import type { EMIInput, EMIResult } from "@/features/calculators/emi/emi-types"

export function calculateEMI(input: EMIInput): EMIResult {
  const validation = validateEMIInput(input)
  if (!validation.success) {
    throw new RangeError("Invalid EMI input")
  }

  const { principalAmount, annualInterestRate, tenure, tenureUnit } = input
  const totalMonths = tenureUnit === "years" ? tenure * 12 : tenure
  const monthlyInterestRate = annualInterestRate / 12 / 100

  let monthlyEMI: number
  if (monthlyInterestRate === 0) {
    monthlyEMI = principalAmount / totalMonths
  } else {
    const compoundFactor = Math.pow(1 + monthlyInterestRate, totalMonths)
    const denominator = compoundFactor - 1
    monthlyEMI = principalAmount * monthlyInterestRate * compoundFactor / denominator
  }

  const totalPayment = monthlyEMI * totalMonths
  const totalInterest = totalPayment - principalAmount

  if (![monthlyEMI, totalPayment, totalInterest, monthlyInterestRate].every(Number.isFinite)) {
    throw new RangeError("EMI calculation produced a non-finite result")
  }

  return {
    monthlyEMI,
    principalAmount,
    totalInterest,
    totalPayment,
    monthlyInterestRate,
    totalMonths,
  }
}

/**
 * Reverse-EMI: solves the standard EMI formula for principal instead of payment, given a fixed
 * monthly instalment budget. Used by the Home Loan Eligibility calculator to turn a maximum
 * affordable EMI into a maximum loan amount, so the reducing-balance formula is defined once and
 * reused in both directions rather than re-derived.
 *
 * P = EMI × [(1 + r)ⁿ − 1] ÷ [r × (1 + r)ⁿ], where r is the monthly rate and n the number of
 * monthly instalments. A non-positive EMI or tenure has no eligible principal.
 */
export function calculateMaxLoanAmount(monthlyEMI: number, annualInterestRate: number, totalMonths: number): number {
  if (!Number.isFinite(monthlyEMI) || monthlyEMI <= 0) return 0
  if (!Number.isFinite(totalMonths) || totalMonths <= 0) return 0
  if (!Number.isFinite(annualInterestRate) || annualInterestRate < 0) return 0

  const monthlyInterestRate = annualInterestRate / 12 / 100

  let principal: number
  if (monthlyInterestRate === 0) {
    principal = monthlyEMI * totalMonths
  } else {
    const compoundFactor = Math.pow(1 + monthlyInterestRate, totalMonths)
    principal = (monthlyEMI * (compoundFactor - 1)) / (monthlyInterestRate * compoundFactor)
  }

  return Number.isFinite(principal) ? Math.max(0, principal) : 0
}
