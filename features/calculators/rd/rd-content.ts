import { calculateRD } from "@/features/calculators/rd/calculate-rd"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

export const rdFAQs: readonly CalculatorFAQ[] = [
  { question: "What is a recurring deposit?", answer: "A recurring deposit is a savings product in which you deposit a fixed amount regularly for an agreed term and earn interest under the bank's terms." },
  { question: "How is RD maturity amount calculated?", answer: "Each monthly instalment is compounded for the time remaining until maturity. Later instalments earn interest for a shorter period than earlier ones." },
  { question: "How is an RD different from an FD?", answer: "An RD is funded through regular instalments, while an FD generally starts with one lump-sum deposit. Their terms and interest calculations can also differ by bank." },
  { question: "Is RD interest taxable in India?", answer: "RD interest may be taxable according to applicable tax rules. Tax treatment depends on individual circumstances, so consult current official guidance or a qualified professional." },
  { question: "What happens if I miss an RD instalment?", answer: "The bank may charge a penalty, delay credit, or apply other account-specific rules. Check the terms of your RD for the exact treatment." },
  { question: "Does this calculator include TDS, taxes, penalties, or premature closure charges?", answer: "No. It provides a before-tax estimate and does not include TDS, taxes, missed-instalment penalties, premature closure charges, or bank-specific adjustments." },
]

export const rdRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "fd-calculator", title: "FD Calculator", description: "Estimate fixed deposit maturity amount and interest earned.", href: "/finance/fd-calculator", category: "Finance" },
  { slug: "sip-calculator", title: "SIP Calculator", description: "Estimate the future value of monthly SIP contributions.", href: "/finance/sip-calculator", category: "Finance" },
  { slug: "lumpsum-calculator", title: "Lumpsum Calculator", description: "Estimate the future value of a one-time investment.", href: "/finance/lumpsum-calculator", category: "Finance" },
  { slug: "ppf-calculator", title: "PPF Calculator", description: "Estimate annual PPF contributions under a constant-rate assumption.", href: "/finance/ppf-calculator", category: "Finance" },
]

const exampleResult = calculateRD({ monthlyDeposit: 5_000, annualInterestRate: 7, duration: 5, durationUnit: "years", compoundingFrequency: "quarterly" })

export const rdWorkedExample: CalculatorWorkedExample = {
  title: "Recurring deposit calculation example",
  description: "For a ₹5,000 monthly deposit at 7% annual interest for 5 years with quarterly compounding, each beginning-of-month instalment compounds only for its remaining term. Actual bank results may differ.",
  inputs: [
    { label: "Monthly deposit", value: "₹5,000" }, { label: "Annual interest rate", value: "7%" },
    { label: "Deposit duration", value: "5 years" }, { label: "Compounding", value: "Quarterly" },
  ],
  results: [
    { label: "Maturity amount", value: formatIndianCurrency(exampleResult.maturityAmount) },
    { label: "Total deposited", value: formatIndianCurrency(exampleResult.totalDeposited) },
    { label: "Interest earned", value: formatIndianCurrency(exampleResult.interestEarned) },
    { label: "Deposit duration", value: `${formatIndianNumber(exampleResult.totalMonths)} months` },
  ],
}
