import { calculateEPF } from "./calculate-epf"
import { EPF_RATE_CONFIG } from "./epf-rate-config"
import type { EPFInput, EPFResult } from "./epf-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const epfFAQs: readonly CalculatorFAQ[] = [
  { question: "What is EPF?", answer: "The Employees' Provident Fund (EPF) is a statutory retirement savings scheme for eligible salaried employees in India, built from monthly employee and employer contributions that earn an EPFO-declared annual interest rate." },
  { question: "What is the statutory EPF contribution rate?", answer: "Under the standard scheme, the employee contributes 12% of basic wages plus dearness allowance, and the employer contributes a matching amount, part of which is normally diverted to the Employees' Pension Scheme (EPS). This calculator lets you edit both rates for illustration; it does not model the EPS split." },
  { question: `Why does the interest rate default to ${EPF_RATE_CONFIG.defaultRate}%?`, answer: `${EPF_RATE_CONFIG.defaultRate}% was the rate declared for ${EPF_RATE_CONFIG.financialYear}. EPFO declares a rate annually and it can change, so treat the default as an editable illustration, not a current-rate guarantee.` },
  { question: "How is EPF interest calculated?", answer: "This calculator compounds interest monthly on the running balance after each month's employee and employer contributions are added. Official EPF accounting calculates interest monthly but credits it once a year on the lowest running balance rules EPFO applies; small differences from an official statement can arise from that timing." },
  { question: "Does this calculator include the Employees' Pension Scheme (EPS)?", answer: "No. In practice, part of the employer's contribution is usually diverted to EPS (subject to a wage ceiling) rather than the EPF account. This calculator treats the entire employer rate you enter as flowing into the EPF corpus, which will overstate the EPF-only balance for most real accounts." },
  { question: "Can I change the employee and employer contribution rates?", answer: "Yes, both are editable so you can model voluntary provident fund (VPF) top-ups or compare scenarios. Real employer contribution rates are ordinarily fixed by law at the statutory rate." },
  { question: "Is the projected EPF corpus guaranteed?", answer: "No. It is an educational projection using one constant assumed interest rate, not an official EPFO passbook figure or a guaranteed maturity amount." },
]

export const epfRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "ppf-calculator", title: "PPF Calculator", description: "Estimate Public Provident Fund maturity under a constant-rate assumption.", href: "/finance/ppf-calculator", category: "Finance" },
  { slug: "gratuity-calculator", title: "Gratuity Calculator", description: "Estimate a standard statutory gratuity amount from wages and completed service.", href: "/finance/gratuity-calculator", category: "Finance" },
  { slug: "retirement-corpus-calculator", title: "Retirement Corpus Calculator", description: "Project a full accumulation-to-withdrawal retirement plan.", href: "/finance/retirement-corpus-calculator", category: "Finance" },
  { slug: "nps-calculator", title: "NPS Calculator", description: "Project a market-linked National Pension System corpus by asset allocation.", href: "/finance/nps-calculator", category: "Finance" },
]

export function createEPFResultText(input: EPFInput, result: EPFResult): string {
  return [
    "ThinkCalculator EPF Projection",
    "",
    `Monthly basic salary (+DA): ${formatIndianCurrency(input.monthlyBasicSalary)}`,
    `Employee / employer contribution rate: ${formatPercentage(input.employeeContributionPercent)} / ${formatPercentage(input.employerContributionPercent)}`,
    `Current age / retirement age: ${input.currentAge} / ${input.retirementAge}`,
    `Assumed constant annual interest rate: ${formatPercentage(input.expectedAnnualInterestRate)}`,
    `Total employee contribution: ${formatIndianCurrency(result.totalEmployeeContribution)}`,
    `Total employer contribution: ${formatIndianCurrency(result.totalEmployerContribution)}`,
    `Estimated interest: ${formatIndianCurrency(result.totalInterest)}`,
    `Estimated corpus at retirement: ${formatIndianCurrency(result.maturityValue)}`,
    "",
    `${EPF_RATE_CONFIG.defaultRate}% is a reference default for ${EPF_RATE_CONFIG.financialYear}, not a current-rate claim. Excludes the EPS carve-out, wage ceiling, and other statutory rules.`,
    "Calculator:",
    `${siteConfig.url}/finance/epf-calculator`,
  ].join("\n")
}

const workedExampleInput: EPFInput = {
  monthlyBasicSalary: 40_000,
  employeeContributionPercent: 12,
  employerContributionPercent: 12,
  currentAge: 28,
  retirementAge: 58,
  expectedAnnualInterestRate: EPF_RATE_CONFIG.defaultRate,
}
const workedExampleResult = calculateEPF(workedExampleInput)

export const epfWorkedExample: CalculatorWorkedExample = {
  title: "EPF projection example",
  description: `For a ₹40,000 monthly basic salary with 12% employee and 12% employer contributions from age 28 to 58, this calculator compounds both streams monthly at a constant assumed ${EPF_RATE_CONFIG.defaultRate}% annual rate.`,
  inputs: [
    { label: "Monthly basic salary", value: "₹40,000" },
    { label: "Employee / employer rate", value: "12% / 12%" },
    { label: "Current age / retirement age", value: "28 / 58" },
    { label: "Assumed annual interest rate", value: `${EPF_RATE_CONFIG.defaultRate}%` },
  ],
  results: [
    { label: "Estimated corpus at retirement", value: formatIndianCurrency(workedExampleResult.maturityValue) },
    { label: "Total employee contribution", value: formatIndianCurrency(workedExampleResult.totalEmployeeContribution) },
    { label: "Total employer contribution", value: formatIndianCurrency(workedExampleResult.totalEmployerContribution) },
    { label: "Estimated interest", value: formatIndianCurrency(workedExampleResult.totalInterest) },
  ],
}

export { workedExampleInput as epfWorkedExampleInput, workedExampleResult as epfWorkedExampleResult }
