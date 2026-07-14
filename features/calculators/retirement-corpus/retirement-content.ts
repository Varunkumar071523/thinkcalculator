import { calculateRetirement } from "./calculate-retirement"
import { formatIndianCurrency } from "@/lib/formatters"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"

const example = calculateRetirement({
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 85,
  currentSavings: 500_000,
  monthlyContribution: 15_000,
  expectedReturnPreRetirement: 10,
  expectedReturnPostRetirement: 10,
  desiredMonthlyWithdrawal: 50_000,
  inflationRate: 6,
})

export const retirementWorkedExample: CalculatorWorkedExample = {
  title: "Retirement Corpus example",
  description: "Starting at age 30 with ₹5,00,000 already saved and a ₹15,000 monthly contribution, retiring at 60, with a 25-year retirement to age 85, a 10% assumed annual return in both phases, a ₹50,000 desired monthly withdrawal in today's money, and 6% assumed annual inflation.",
  inputs: [
    { label: "Current age / retirement age / life expectancy", value: "30 / 60 / 85" },
    { label: "Current savings", value: "₹5,00,000" },
    { label: "Monthly contribution", value: "₹15,000" },
    { label: "Expected annual return (both phases)", value: "10%" },
    { label: "Desired monthly withdrawal (today's money)", value: "₹50,000" },
    { label: "Assumed annual inflation", value: "6%" },
  ],
  results: [
    { label: "Corpus at retirement", value: formatIndianCurrency(example.corpusAtRetirement) },
    { label: "Total contributions", value: formatIndianCurrency(example.totalContributions) },
    { label: "First-year monthly withdrawal", value: formatIndianCurrency(example.firstYearMonthlyWithdrawal) },
    { label: "Final-year monthly withdrawal", value: formatIndianCurrency(example.finalMonthlyWithdrawal) },
    { label: "Remaining balance at life expectancy", value: formatIndianCurrency(example.remainingBalanceAtLifeExpectancy) },
    { label: "Corpus lasted the full retirement duration", value: example.corpusLastsFullDuration ? "Yes" : "No" },
  ],
}

export const retirementFAQs: readonly CalculatorFAQ[] = [
  { question: "How do the accumulation and retirement phases connect?", answer: "The exact corpus projected at the end of the accumulation phase (your retirement age) becomes the opening balance of the retirement phase. It is calculated once and carried across directly, with no separate re-calculation or rounding in between." },
  { question: "What does \"desired monthly withdrawal\" mean if it grows every year?", answer: "It is valued on the day your retirement begins, not on today's date. For example, if you are 30 now and plan to retire at 60, entering ₹50,000 means ₹50,000 in age-60 rupees for the first year of retirement — it is not ₹50,000 in today's (age-30) rupees inflated forward to age 60. From that first retirement year onward, the calculator grows the nominal (actual rupee) monthly withdrawal by your assumed inflation rate once per year, so its real, inflation-adjusted purchasing power stays constant for the rest of retirement." },
  { question: "Why are there two return-rate fields?", answer: "Pre-retirement and post-retirement portfolios commonly use different assumptions: a growth-oriented allocation while contributing, and a more conservative one after retiring. The post-retirement field defaults to the same value as the pre-retirement field, so you can ignore it entirely for a simple single-rate estimate, or change it for a more realistic split." },
  { question: "What happens if the corpus runs out before life expectancy?", answer: "Withdrawals are taken from the opening balance first, then that month's growth applies to what remains, matching the SWP Calculator's convention. If the balance cannot cover a full withdrawal, only the remaining balance is paid out and the balance is reported as exhausted at that exact month; it is never allowed to go negative." },
  { question: "Why does the example show a large remaining surplus?", answer: "This example uses the same 10% assumed return for both phases. Because that return is well above the assumed monthly withdrawal rate, the corpus keeps compounding faster than it is drawn down over 25 years. Enter a lower, more conservative expected return for the retirement phase to see a less optimistic outcome." },
  { question: "Does this account for taxation, healthcare costs, or a government pension?", answer: "No. This is a deterministic, constant-rate illustrative projection only. It does not model taxation of withdrawals, healthcare or long-term-care costs, Social-Security-equivalent government pension income, or any statutory rules." },
  { question: "Does this model market ups and downs during retirement?", answer: "No. Both phases use one constant assumed annual return each. Real portfolios experience sequence-of-returns risk — the order in which gains and losses occur matters, especially in the years just before and after retirement — which this calculator does not simulate." },
  { question: "Is this financial advice or a retirement plan?", answer: "No. This is an illustrative educational projection based on constant assumed rates, not a personalised retirement plan. It excludes taxation, healthcare costs, sequence-of-returns risk, and changes in your circumstances. Consult a qualified financial adviser before making retirement decisions." },
]

export const retirementRelatedCalculators: readonly RelatedCalculator[] = [
  { slug: "sip-calculator", title: "SIP Calculator", description: "Estimate the future value of regular monthly contributions.", href: "/finance/sip-calculator", category: "Finance" },
  { slug: "step-up-sip-calculator", title: "Step-up SIP Calculator", description: "Estimate a SIP that increases contributions yearly.", href: "/finance/step-up-sip-calculator", category: "Finance" },
  { slug: "swp-calculator", title: "SWP Calculator", description: "Estimate how long a lumpsum investment supports fixed monthly withdrawals.", href: "/finance/swp-calculator", category: "Finance" },
  { slug: "inflation-calculator", title: "Inflation Calculator", description: "Estimate future cost or the present-day purchasing power of a future amount.", href: "/finance/inflation-calculator", category: "Finance" },
]
