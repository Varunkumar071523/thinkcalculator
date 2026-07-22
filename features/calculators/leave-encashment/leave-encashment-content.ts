import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { calculateLeaveEncashment } from "./calculate-leave-encashment"
import { LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE, LEAVE_ENCASHMENT_STATUTORY_LIMIT } from "./leave-encashment-regulatory-config"
import type { LeaveEncashmentBindingConstraint, LeaveEncashmentInput, LeaveEncashmentResult } from "./leave-encashment-types"
import { LEAVE_ENCASHMENT_DEFAULT_INPUT } from "./leave-encashment-url-state"

export const leaveEncashmentFAQs: readonly CalculatorFAQ[] = [
  {
    question: "Is leave encashment received while I am still working taxable?",
    answer: "Yes, fully. Section 10(10AA) exemption applies only to leave encashment received at retirement or resignation. Leave encashed during service (an employer's annual encashment scheme, for example) is fully taxable as salary, for both government and non-government employees, and is outside this calculator's scope.",
  },
  {
    question: "What counts as \"salary\" for the 10-month average and the leave-at-credit components?",
    answer: "Basic pay plus dearness allowance that forms part of retirement benefits, and commission that is a fixed percentage of turnover if applicable. It does not include HRA, bonus, most other allowances, or one-off commission. This calculator collects last-drawn and 10-month-average basic + DA directly rather than deriving them from gross salary.",
  },
  {
    question: "Why does the calculator ask for both \"leave days earned per year\" and \"leave days encashed\"?",
    answer: "The exemption's leave-at-credit component is capped by law at 30 days for every completed year of service, regardless of your employer's actual annual leave-earning rate. The calculator uses \"leave days earned per year\" (capped at 30) times years of service to find that statutory ceiling, then applies it to whichever is smaller: that ceiling or the leave days you actually encashed.",
  },
  {
    question: "Is the ₹25 lakh limit per employer or a lifetime aggregate?",
    answer: "It is an aggregate limit across a non-government employee's lifetime and across employers: if leave encashment is received from more than one employer in the same previous year, or from an earlier employer in an earlier year, the ₹25 lakh ceiling still applies in aggregate, not separately per employer.",
  },
  {
    question: "Do government employees really have no monetary ceiling at all?",
    answer: "For Central and State Government employees, leave encashment received on retirement is fully exempt under section 10(10AA)(i), with no statutory ceiling. This calculator applies that rule directly when \"Government\" is selected and does not run the least-of-four calculation in that case.",
  },
  {
    question: "Does choosing the old or new tax regime change this exemption?",
    answer: "No. The section 10(10AA) exemption is available under both the old and new tax regimes; you do not need to select a particular regime to claim it. This calculator does not ask for a regime for that reason.",
  },
  {
    question: "What is the \"marginal tax rate\" input used for?",
    answer: "It is an illustrative rate you choose to estimate how much tax the taxable portion (the amount above the exemption) might attract, and the resulting net amount after that tax. It is not part of the statutory exemption formula, is not fetched from any income-tax slab calculation, and should be set to your own expected marginal rate for a more realistic estimate.",
  },
  {
    question: "Can the calculator tell me my exact eligible leave balance or verify my employer's leave policy?",
    answer: "No. It only performs the arithmetic on the figures you enter. Your actual encashable leave balance, leave-accumulation policy, retirement or resignation date, and employer's final computation depend on company policy, HR records, and facts this calculator does not verify.",
  },
]

export const leaveEncashmentRelatedCalculators: readonly RelatedCalculator[] = [
  {
    slug: "gratuity-calculator",
    title: "Gratuity Calculator",
    description: "Estimate the separate statutory gratuity benefit payable on retirement or resignation.",
    href: "/finance/gratuity-calculator",
    category: "Finance",
  },
  {
    slug: "income-tax-calculator",
    title: "Income Tax Calculator",
    description: "Estimate full income tax liability under the old and new regimes for a more precise post-tax figure.",
    href: "/finance/income-tax-calculator",
    category: "Finance",
  },
  {
    slug: "retirement-corpus-calculator",
    title: "Retirement Corpus Calculator",
    description: "Plan how a retirement payout, including leave encashment, contributes to a long-term retirement corpus.",
    href: "/finance/retirement-corpus-calculator",
    category: "Finance",
  },
]

export const leaveEncashmentWorkedExampleInput: LeaveEncashmentInput = LEAVE_ENCASHMENT_DEFAULT_INPUT
export const leaveEncashmentWorkedExampleResult = calculateLeaveEncashment(leaveEncashmentWorkedExampleInput)

export const leaveEncashmentWorkedExample: CalculatorWorkedExample = {
  title: "Statutory limit binds the exemption",
  description: "A non-government employee retires after 30 years with a ₹32,00,000 leave encashment payout. The actual amount, the 10-month-average component, and the leave-at-credit component are all above ₹25,00,000, so the statutory limit itself is the smallest of the four and becomes the exempt amount — the remaining ₹7,00,000 is taxable.",
  inputs: [
    { label: "Employee type", value: "Non-government" },
    { label: "Last-drawn basic + DA", value: formatIndianCurrency(leaveEncashmentWorkedExampleInput.lastDrawnBasicSalary) },
    { label: "10-month average salary", value: formatIndianCurrency(leaveEncashmentWorkedExampleInput.averageMonthlySalary) },
    { label: "Leave encashment received", value: formatIndianCurrency(leaveEncashmentWorkedExampleInput.leaveEncashmentAmountReceived) },
    { label: "Leave days encashed", value: `${leaveEncashmentWorkedExampleInput.leaveDaysEncashed} days` },
    { label: "Years of completed service", value: `${leaveEncashmentWorkedExampleInput.yearsOfCompletedService} years` },
    { label: "Leave days earned per year", value: `${leaveEncashmentWorkedExampleInput.leaveDaysEarnedPerYear} days` },
  ],
  results: [
    { label: "Actual amount received", value: formatIndianCurrency(leaveEncashmentWorkedExampleResult.componentActualReceived) },
    { label: "10-month average salary × 10", value: formatIndianCurrency(leaveEncashmentWorkedExampleResult.componentTenMonthAverageSalary) },
    { label: "Cash equivalent of leave at credit", value: formatIndianCurrency(leaveEncashmentWorkedExampleResult.componentLeaveAtCredit) },
    { label: "Statutory limit", value: formatIndianCurrency(leaveEncashmentWorkedExampleResult.componentStatutoryLimit) },
    { label: "Exempt amount (least of the four)", value: formatIndianCurrency(leaveEncashmentWorkedExampleResult.exemptAmount) },
    { label: "Taxable amount", value: formatIndianCurrency(leaveEncashmentWorkedExampleResult.taxableAmount) },
  ],
}

const BINDING_CONSTRAINT_LABELS: Readonly<Record<LeaveEncashmentBindingConstraint, string>> = {
  "government-full-exemption": "Government employee — full exemption, no ceiling",
  "actual-received": "Actual amount received",
  "ten-month-average": "10-month average salary",
  "leave-at-credit": "Cash equivalent of leave at credit",
  "statutory-limit": "Statutory limit",
}

export function describeLeaveEncashmentBindingConstraint(bindingConstraint: LeaveEncashmentBindingConstraint): string {
  return BINDING_CONSTRAINT_LABELS[bindingConstraint]
}

export function createLeaveEncashmentResultText(input: LeaveEncashmentInput, result: LeaveEncashmentResult): string {
  return [
    "ThinkCalculator Leave Encashment Exemption Estimate",
    "",
    `Employee type: ${input.employeeType === "government" ? "Government (Central/State)" : "Non-government"}`,
    `Leave encashment amount received: ${formatIndianCurrency(input.leaveEncashmentAmountReceived)}`,
    input.employeeType === "non-government" ? `Actual amount received: ${formatIndianCurrency(result.componentActualReceived)}` : "",
    input.employeeType === "non-government" ? `10-month average salary × 10: ${formatIndianCurrency(result.componentTenMonthAverageSalary)}` : "",
    input.employeeType === "non-government" ? `Cash equivalent of leave at credit: ${formatIndianCurrency(result.componentLeaveAtCredit)} (${formatIndianNumber(result.eligibleLeaveDaysForCredit)} eligible days)` : "",
    input.employeeType === "non-government" ? `Statutory limit: ${formatIndianCurrency(result.componentStatutoryLimit)}` : "",
    `Binding constraint: ${describeLeaveEncashmentBindingConstraint(result.bindingConstraint)}`,
    `Exempt amount: ${formatIndianCurrency(result.exemptAmount)}`,
    `Taxable amount: ${formatIndianCurrency(result.taxableAmount)}`,
    `Estimated tax on taxable amount (at ${result.marginalTaxRate}%): ${formatIndianCurrency(result.estimatedTaxOnTaxableAmount)}`,
    `Estimated net amount after tax: ${formatIndianCurrency(result.netAmountAfterTax)}`,
    "",
    `Regulatory sources reviewed ${LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE}. This is an educational estimate under section 10(10AA), not tax advice.`,
    "Calculator:",
    `${siteConfig.url}/finance/leave-encashment-calculator`,
  ].filter(Boolean).join("\n")
}

export function createLeaveEncashmentPrintDisclaimer(): string {
  return `Official sources reviewed ${LEAVE_ENCASHMENT_REGULATORY_REVIEW_DATE}. This estimate applies the section 10(10AA) least-of-four formula (non-government) or full exemption (government) to entered figures, using the current ₹${LEAVE_ENCASHMENT_STATUTORY_LIMIT.toLocaleString("en-IN")} statutory limit. It is not personalised tax advice and does not verify employer leave records, retirement or resignation facts, or the tax regime you file under.`
}
