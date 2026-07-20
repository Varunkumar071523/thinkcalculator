import { calculateHomeLoanEligibility } from "@/features/calculators/home-loan-eligibility/calculate-home-loan-eligibility"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { formatIndianCurrency } from "@/lib/formatters"

export const homeLoanEligibilityFAQs: readonly CalculatorFAQ[] = [
  {
    question: "What is FOIR?",
    answer: "FOIR, or Fixed Obligation to Income Ratio, is the share of your net monthly income that lenders assume can go toward all fixed monthly obligations, including the new home loan EMI, existing loan EMIs, and other recurring instalments. Lenders use it to estimate how much EMI you can afford before deciding a loan amount.",
  },
  {
    question: "Why do the Conservative, Standard, and Aggressive presets give different results?",
    answer: "Each preset assumes a different FOIR percentage: Conservative uses 40% of net monthly income, Standard uses 50%, and Aggressive uses 60%. A higher percentage assumes you can commit more of your income to EMIs, which raises the maximum eligible EMI and, in turn, the maximum eligible loan amount. Lenders and borrowers may reasonably prefer different bands depending on other financial commitments and risk appetite.",
  },
  {
    question: "Is this the loan amount a bank will actually approve?",
    answer: "No. This is an estimate based on the FOIR method and the reverse-EMI calculation alone. Actual bank sanction depends on the lender's own credit policy, your credit score, employment type and stability, property valuation, loan-to-value norms, processing fees, other underwriting checks, and documentation. Treat this figure as a starting point for planning, not a loan offer or pre-approval.",
  },
  {
    question: "What happens if my existing EMIs already exceed the FOIR budget?",
    answer: "If your existing monthly EMI obligations alone are higher than the FOIR percentage of your income, the calculator shows zero eligible EMI and zero eligible loan amount for that band, since no further monthly obligation would fit within the assumed limit. Reducing existing EMIs, choosing a higher FOIR band, or increasing income would be the usual ways to change that outcome.",
  },
  {
    question: "How does own contribution affect total property affordability?",
    answer: "Own contribution, or down payment, is added directly to the maximum eligible loan amount to estimate the total property value you could afford. A larger own contribution increases total affordability without changing your eligible EMI or loan amount, since it does not depend on FOIR at all.",
  },
  {
    question: "Does a longer loan tenure increase my eligible loan amount?",
    answer: "Usually, yes. For the same eligible EMI and interest rate, a longer tenure spreads repayment over more months, which generally increases the maximum eligible loan amount. It also increases the total interest paid over the life of the loan, so a longer tenure trades a smaller monthly commitment for a larger total cost.",
  },
]

export const homeLoanEligibilityRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "emi-calculator", title: "EMI Calculator", description: "Calculate the monthly EMI, total interest, and repayment schedule for a specific loan amount.", href: "/finance/emi-calculator", category: "Finance" },
  { slug: "hra-calculator", title: "HRA Calculator", description: "Estimate your HRA exemption, which affects the net income available for EMIs.", href: "/finance/hra-calculator", category: "Finance" },
  { slug: "income-tax-calculator", title: "Income Tax Calculator", description: "Estimate take-home income after tax to plan a realistic monthly budget.", href: "/finance/income-tax-calculator", category: "Finance" },
]

const exampleResult = calculateHomeLoanEligibility({
  netMonthlyIncome: 100_000,
  existingMonthlyEMI: 10_000,
  annualInterestRate: 8.5,
  tenureYears: 20,
  ownContribution: 1_000_000,
  foirBand: "standard",
})

export const homeLoanEligibilityWorkedExample: CalculatorWorkedExample = {
  title: "Home loan eligibility example",
  description: "For a ₹1,00,000 net monthly income, ₹10,000 of existing EMI obligations, the Standard (50%) FOIR band, an 8.5% annual interest rate, and a 20-year tenure, the calculator first finds the maximum eligible EMI, then reverses the EMI formula to find the maximum eligible loan amount.",
  inputs: [
    { label: "Net monthly income", value: "₹1,00,000" },
    { label: "Existing monthly EMI", value: "₹10,000" },
    { label: "FOIR band", value: "Standard (50%)" },
    { label: "Annual interest rate", value: "8.5%" },
    { label: "Loan tenure", value: "20 years" },
    { label: "Own contribution", value: "₹10,00,000" },
  ],
  results: [
    { label: "Max eligible EMI", value: formatIndianCurrency(exampleResult.maxEligibleEMI) },
    { label: "Max eligible loan amount", value: formatIndianCurrency(exampleResult.maxEligibleLoanAmount) },
    { label: "Total property affordability", value: formatIndianCurrency(exampleResult.totalPropertyAffordability) },
  ],
}
