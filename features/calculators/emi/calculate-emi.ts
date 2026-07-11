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
