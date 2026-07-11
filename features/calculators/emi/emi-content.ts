import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"

export const emiFAQs: readonly CalculatorFAQ[] = [
  { question: "What is EMI?", answer: "EMI, or Equated Monthly Instalment, is the fixed amount generally paid each month toward a loan. It includes both principal and interest." },
  { question: "How is EMI calculated?", answer: "EMI is calculated using the principal, monthly interest rate, and total number of monthly instalments. The reducing balance formula determines the fixed monthly payment." },
  { question: "Does a longer loan tenure reduce EMI?", answer: "A longer tenure usually reduces the monthly EMI, but it generally increases the total interest paid because the loan remains outstanding for longer." },
  { question: "What is the difference between fixed and floating interest rates?", answer: "A fixed rate generally stays unchanged for an agreed period, while a floating rate can move with the lender's benchmark. Changes to a floating rate may affect the EMI, tenure, or both." },
  { question: "Can I reduce my loan EMI?", answer: "Depending on lender terms, a larger down payment, lower interest rate, longer tenure, or principal prepayment may reduce EMI. Consider the effect on total interest and any applicable charges." },
  { question: "Does this calculator include processing fees or insurance?", answer: "No. The estimate uses only principal, interest rate, and tenure. Processing fees, insurance, taxes, prepayment charges, and other lender costs are not included." },
]

export const emiRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "home-loan", title: "Home Loan Calculator", description: "Explore tools for planning a home loan.", href: "/calculators", category: "Finance" },
  { slug: "personal-loan", title: "Personal Loan Calculator", description: "Explore tools for estimating personal loan costs.", href: "/calculators", category: "Finance" },
  { slug: "car-loan", title: "Car Loan Calculator", description: "Explore tools for planning vehicle finance.", href: "/calculators", category: "Finance" },
  { slug: "loan-prepayment", title: "Loan Prepayment Calculator", description: "Explore tools for understanding loan prepayments.", href: "/calculators", category: "Finance" },
]

const exampleResult = calculateEMI({
  principalAmount: 2_500_000,
  annualInterestRate: 8.5,
  tenure: 20,
  tenureUnit: "years",
})

export const emiWorkedExample: CalculatorWorkedExample = {
  title: "EMI calculation example",
  description: "For a ₹25,00,000 loan at 8.5% annual interest over 20 years, the calculator converts the tenure to 240 months and applies the reducing-balance EMI formula.",
  inputs: [
    { label: "Loan amount", value: "₹25,00,000" },
    { label: "Annual interest rate", value: "8.5%" },
    { label: "Loan tenure", value: "20 years" },
  ],
  results: [
    { label: "Monthly EMI", value: formatIndianCurrency(exampleResult.monthlyEMI) },
    { label: "Total interest", value: formatIndianCurrency(exampleResult.totalInterest) },
    { label: "Total repayment", value: formatIndianCurrency(exampleResult.totalPayment) },
    { label: "Monthly instalments", value: formatIndianNumber(exampleResult.totalMonths) },
  ],
}
