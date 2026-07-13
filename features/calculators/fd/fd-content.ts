import { calculateFD } from "@/features/calculators/fd/calculate-fd"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const fdFAQs: readonly CalculatorFAQ[] = [
  { question: "What is a fixed deposit?", answer: "A fixed deposit is a bank deposit held for an agreed period at a stated interest rate, subject to the bank's terms and applicable rules." },
  { question: "How is FD maturity amount calculated?", answer: "The principal is compounded using the annual interest rate, deposit duration, and selected compounding frequency. The interest earned is the maturity amount minus the principal." },
  { question: "Which compounding frequency gives a higher maturity value?", answer: "For the same principal, stated annual rate, and duration, more frequent compounding generally produces a slightly higher maturity amount." },
  { question: "Is FD interest taxable in India?", answer: "FD interest may be taxable according to applicable tax rules. Tax treatment depends on individual circumstances and can change, so consult current official guidance or a qualified professional." },
  { question: "What happens if I withdraw an FD early?", answer: "A bank may apply a lower interest rate, penalty, or other conditions for premature withdrawal. The exact treatment depends on the deposit terms." },
  { question: "Does this calculator include TDS, taxes, or penalties?", answer: "No. It estimates compound interest before TDS, taxes, premature-withdrawal penalties, and bank-specific adjustments." },
]

export const fdRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "rd", title: "RD Calculator", description: "Explore tools for recurring deposits.", href: "/calculators", category: "Finance" },
  { slug: "sip-calculator", title: "SIP Calculator", description: "Estimate the future value of monthly SIP contributions.", href: "/finance/sip-calculator", category: "Finance" },
  { slug: "lumpsum-calculator", title: "Lumpsum Calculator", description: "Estimate the future value of a one-time investment.", href: "/finance/lumpsum-calculator", category: "Finance" },
  { slug: "ppf-calculator", title: "PPF Calculator", description: "Estimate annual PPF contributions under a constant-rate assumption.", href: "/finance/ppf-calculator", category: "Finance" },
]

const exampleResult = calculateFD({
  principalAmount: 100_000,
  annualInterestRate: 7,
  duration: 5,
  durationUnit: "years",
  compoundingFrequency: "quarterly",
})

export const fdWorkedExample: CalculatorWorkedExample = {
  title: "Fixed deposit calculation example",
  description: "For a ₹1,00,000 deposit at 7% annual interest for 5 years with quarterly compounding, the calculator applies 20 compounding periods. Actual bank returns may differ because of bank rules, compounding conventions, premature withdrawal, and taxes.",
  inputs: [
    { label: "Deposit amount", value: "₹1,00,000" },
    { label: "Annual interest rate", value: "7%" },
    { label: "Deposit duration", value: "5 years" },
    { label: "Compounding", value: "Quarterly" },
  ],
  results: [
    { label: "Maturity amount", value: formatIndianCurrency(exampleResult.maturityAmount) },
    { label: "Principal amount", value: formatIndianCurrency(exampleResult.principalAmount) },
    { label: "Interest earned", value: formatIndianCurrency(exampleResult.interestEarned) },
    { label: "Deposit duration", value: `${formatIndianNumber(exampleResult.totalMonths)} months` },
  ],
}
