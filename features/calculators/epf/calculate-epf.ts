import { validateEPFInput } from "./epf-schema"
import type { EPFInput, EPFResult, EPFScheduleRow } from "./epf-types"

/** Beginning-of-month contribution, matching calculateSIP/calculateStepUpSIP/calculateRetirement's
 * convention: `balance = (balance + contribution) * (1 + monthlyRate)` each month. Employee and
 * employer contributions are tracked as separate running totals (not just a combined figure) so the
 * yearly schedule can report a genuine 3-way split — contribution, employer contribution, interest —
 * for the stacked bar chart, with each month's interest attributed proportionally across the two
 * contribution streams by their share of the pre-interest balance. This calculator is a simplified,
 * editable-rate illustration: it does not model the statutory EPS carve-out from the employer's
 * contribution, the EPF wage ceiling, or monthly interest-eligibility rules — see epfKnowledgeContent
 * for that disclosure.
 */
export function calculateEPF(input: EPFInput): EPFResult {
  const validation = validateEPFInput(input)
  if (!validation.success) throw new RangeError("Invalid EPF input")
  const { monthlyBasicSalary, employeeContributionPercent, employerContributionPercent, currentAge, retirementAge, expectedAnnualInterestRate } = validation.data

  const monthlyEmployeeContribution = monthlyBasicSalary * (employeeContributionPercent / 100)
  const monthlyEmployerContribution = monthlyBasicSalary * (employerContributionPercent / 100)
  const months = (retirementAge - currentAge) * 12
  const monthlyRate = expectedAnnualInterestRate / 12 / 100

  const schedule: EPFScheduleRow[] = []
  let balance = 0
  let cumulativeEmployeeContribution = 0
  let cumulativeEmployerContribution = 0
  let cumulativeInterest = 0
  let yearEmployeeContribution = 0
  let yearEmployerContribution = 0
  let yearInterest = 0

  for (let month = 1; month <= months; month++) {
    const preGrowthBalance = balance + monthlyEmployeeContribution + monthlyEmployerContribution
    const interestThisMonth = preGrowthBalance * monthlyRate
    balance = preGrowthBalance + interestThisMonth
    if (!Number.isFinite(balance)) throw new RangeError("EPF calculation produced a non-finite result")

    yearEmployeeContribution += monthlyEmployeeContribution
    yearEmployerContribution += monthlyEmployerContribution
    yearInterest += interestThisMonth

    if (month % 12 === 0) {
      cumulativeEmployeeContribution += yearEmployeeContribution
      cumulativeEmployerContribution += yearEmployerContribution
      cumulativeInterest += yearInterest
      schedule.push({
        year: month / 12,
        age: currentAge + month / 12,
        employeeContribution: yearEmployeeContribution,
        employerContribution: yearEmployerContribution,
        interestEarned: yearInterest,
        cumulativeEmployeeContribution,
        cumulativeEmployerContribution,
        cumulativeInterest,
        closingBalance: balance,
      })
      yearEmployeeContribution = 0
      yearEmployerContribution = 0
      yearInterest = 0
    }
  }

  const result: EPFResult = {
    ...validation.data,
    monthlyEmployeeContribution,
    monthlyEmployerContribution,
    totalEmployeeContribution: cumulativeEmployeeContribution,
    totalEmployerContribution: cumulativeEmployerContribution,
    totalInterest: cumulativeInterest,
    maturityValue: balance,
    schedule,
  }
  if (!Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)) throw new RangeError("EPF calculation produced a non-finite result")
  return result
}
