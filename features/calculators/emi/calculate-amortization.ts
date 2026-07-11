import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import type { AmortizationRow, EMIInput, EMIResult } from "@/features/calculators/emi/emi-types"

export function calculateAmortizationSchedule(input: EMIInput, suppliedResult?: EMIResult): readonly AmortizationRow[] {
  const result = suppliedResult ?? calculateEMI(input)
  const expected = calculateEMI(input)
  if (result.totalMonths !== expected.totalMonths || Math.abs(result.principalAmount - input.principalAmount) > 0.000001) {
    throw new RangeError("EMI result does not match input")
  }

  const rows: AmortizationRow[] = []
  let balance = input.principalAmount
  let cumulativePrincipal = 0
  let cumulativeInterest = 0

  for (let paymentNumber = 1; paymentNumber <= result.totalMonths; paymentNumber += 1) {
    const openingBalance = balance
    const interestPaid = result.monthlyInterestRate === 0 ? 0 : openingBalance * result.monthlyInterestRate
    const scheduledPrincipal = result.monthlyEMI - interestPaid
    const principalPaid = paymentNumber === result.totalMonths ? openingBalance : Math.min(openingBalance, scheduledPrincipal)
    const emi = principalPaid + interestPaid
    balance = Math.max(0, openingBalance - principalPaid)
    cumulativePrincipal += principalPaid
    cumulativeInterest += interestPaid
    rows.push({ paymentNumber, openingBalance, emi, principalPaid, interestPaid, closingBalance: balance, cumulativePrincipal, cumulativeInterest })
  }

  return rows
}
