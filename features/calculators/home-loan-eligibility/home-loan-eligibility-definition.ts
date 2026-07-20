import {
  homeLoanEligibilityFAQs,
  homeLoanEligibilityRelatedCalculators,
  homeLoanEligibilityWorkedExample,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-content"
import { HOME_LOAN_ELIGIBILITY_LIMITS } from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-schema"
import type { CalculatorDefinition } from "@/types/calculator"

export const homeLoanEligibilityCalculatorDefinition = {
  id: "home-loan-eligibility-calculator",
  slug: "home-loan-eligibility-calculator",
  title: "Home Loan Eligibility Calculator",
  shortTitle: "Home Loan Eligibility",
  description: "Estimate the maximum home loan EMI, loan amount, and total property affordability you may be eligible for, using the FOIR (Fixed Obligation to Income Ratio) method.",
  category: "Finance",
  canonicalPath: "/finance/home-loan-eligibility-calculator",
  inputs: [
    { id: "net-monthly-income", type: "number", label: "Net monthly income", description: "Enter your take-home monthly income after deductions.", prefix: "₹", min: HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.min, max: HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.max, step: 1_000, required: true },
    { id: "existing-monthly-emi", type: "number", label: "Existing monthly EMI obligations", description: "Enter the total monthly EMI you already pay on other loans, if any.", prefix: "₹", min: HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.min, max: HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.max, step: 500, required: true },
    { id: "foir-band", type: "select", label: "FOIR band", description: "Choose how much of your income lenders may assume can go toward all EMIs.", options: [{ label: "Conservative (40%)", value: "conservative" }, { label: "Standard (50%)", value: "standard" }, { label: "Aggressive (60%)", value: "aggressive" }], required: true },
    { id: "annual-interest-rate", type: "number", label: "Annual interest rate", description: "Enter the lender's expected annual interest rate.", suffix: "%", min: HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.min, max: HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.max, step: 0.05, required: true },
    { id: "loan-tenure", type: "number", label: "Loan tenure (years)", description: "Enter the repayment period in years.", min: HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.min, max: HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.max, step: 1, required: true },
    { id: "own-contribution", type: "number", label: "Own contribution / down payment", description: "Enter the amount you plan to pay from your own funds.", prefix: "₹", min: HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.min, max: HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.max, step: 10_000, required: true },
  ],
  formula: {
    title: "FOIR and reverse-EMI methodology",
    expression: "Max eligible EMI = (Net monthly income × FOIR%) − Existing EMIs; Max eligible loan = EMI × [(1+r)ⁿ − 1] ÷ [r × (1+r)ⁿ]",
    description: "Net monthly income is multiplied by the chosen FOIR percentage and existing EMI obligations are subtracted, floored at zero, to give the maximum eligible EMI. That EMI is then run through the standard reducing-balance EMI formula solved for principal instead of payment — the same formula the EMI Calculator uses, applied in reverse — to estimate the maximum eligible loan amount. Own contribution is added to that loan amount to estimate total property affordability.",
    variables: [
      { symbol: "FOIR%", meaning: "Fixed Obligation to Income Ratio band: 40% (Conservative), 50% (Standard), or 60% (Aggressive)" },
      { symbol: "r", meaning: "Monthly interest rate as a decimal" },
      { symbol: "n", meaning: "Total number of monthly instalments (tenure in years × 12)" },
    ],
  },
  workedExample: homeLoanEligibilityWorkedExample,
  faqs: homeLoanEligibilityFAQs,
  relatedCalculators: homeLoanEligibilityRelatedCalculators,
  metadata: {
    title: "Home Loan Eligibility Calculator: FOIR-Based Loan Amount Estimate",
    description: "Estimate your maximum eligible home loan EMI, loan amount, and total property affordability using the FOIR method, with Conservative, Standard, and Aggressive presets.",
    keywords: ["home loan eligibility calculator", "FOIR calculator", "home loan eligibility India", "max loan amount calculator"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
