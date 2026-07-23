import type { CalculatorDefinition } from "@/types/calculator"
import {
  epsPensionFAQs,
  epsPensionRelatedCalculators,
  epsPensionWorkedExample,
} from "./eps-pension-content"
import {
  EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS,
  EPS_PENSION_BONUS_SERVICE_YEARS,
  EPS_PENSION_DIVISOR,
  EPS_PENSION_EARLY_PENSION_MIN_AGE,
  EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR,
  EPS_PENSION_MINIMUM_MONTHLY_PENSION,
  EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS,
  EPS_PENSION_STANDARD_RETIREMENT_AGE,
  EPS_PENSION_WAGE_CEILING,
} from "./eps-pension-regulatory-config"
import { EPS_PENSION_LIMITS } from "./eps-pension-schema"

export const epsPensionCalculatorDefinition = {
  id: "eps-pension-calculator",
  slug: "eps-pension-calculator",
  title: "EPS Pension Calculator",
  shortTitle: "EPS Pension Calculator",
  description: `Estimate the monthly pension payable under the Employees' Pension Scheme, 2026 (EPS 2026), using the current ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} pensionable-salary ceiling, ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus-service weightage, and ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum-pension floor.`,
  category: "Finance",
  canonicalPath: "/finance/eps-pension-calculator",
  inputs: [
    {
      id: "average-monthly-salary",
      type: "number",
      label: "Average monthly basic + DA (last 60 months)",
      description: "Average of basic pay plus dearness allowance over the 60 months before exit from the pension fund. The formula caps this at the current wage ceiling for a standard member.",
      prefix: "₹",
      min: EPS_PENSION_LIMITS.averageMonthlySalary.min,
      max: EPS_PENSION_LIMITS.averageMonthlySalary.max,
      step: 100,
      required: true,
    },
    {
      id: "years-of-pensionable-service",
      type: "number",
      label: "Years of pensionable service",
      description: `At least ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years are needed for a monthly pension. ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years or more adds a ${EPS_PENSION_BONUS_SERVICE_YEARS}-year bonus to the formula.`,
      suffix: "years",
      min: EPS_PENSION_LIMITS.yearsOfPensionableService.min,
      max: EPS_PENSION_LIMITS.yearsOfPensionableService.max,
      step: 1,
      required: true,
    },
    {
      id: "age-option",
      type: "select",
      label: "Pension option",
      description: `Standard age (${EPS_PENSION_STANDARD_RETIREMENT_AGE}) uses the formula as-is. Early pension (from ${EPS_PENSION_EARLY_PENSION_MIN_AGE}) reduces it by ${EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR}% per year short of ${EPS_PENSION_STANDARD_RETIREMENT_AGE}.`,
      options: [
        { label: `Standard age (${EPS_PENSION_STANDARD_RETIREMENT_AGE})`, value: "standard" },
        { label: `Early pension (${EPS_PENSION_EARLY_PENSION_MIN_AGE}–57)`, value: "early" },
      ],
      required: true,
    },
    {
      id: "early-pension-age",
      type: "number",
      label: "Early pension start age",
      description: "Only used when \"Early pension\" is selected above.",
      suffix: "years",
      min: EPS_PENSION_LIMITS.earlyPensionAge.min,
      max: EPS_PENSION_LIMITS.earlyPensionAge.max,
      step: 1,
      required: true,
    },
  ],
  formula: {
    title: "EPS 2026 monthly pension formula",
    expression: `Monthly pension = min(Average monthly salary, ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}) × (Years of pensionable service + bonus) ÷ ${EPS_PENSION_DIVISOR}, floored at ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")}`,
    description: `Pensionable salary is the average monthly basic + DA over the last 60 months, capped at the current ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} wage ceiling. Pensionable service is the entered years, plus a ${EPS_PENSION_BONUS_SERVICE_YEARS}-year bonus if that figure is ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS} years or more. The result is never less than ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")}/month for an eligible member at the standard age, and a member needs at least ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years of pensionable service to qualify at all. Taking a pension early (from age ${EPS_PENSION_EARLY_PENSION_MIN_AGE}) reduces the standard-age pension by ${EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR}% for every year short of ${EPS_PENSION_STANDARD_RETIREMENT_AGE}.`,
    variables: [
      { symbol: "Pensionable salary", meaning: `Average monthly basic + DA over the last 60 months, capped at ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")}` },
      { symbol: "Pensionable service", meaning: `Years of pensionable service, plus ${EPS_PENSION_BONUS_SERVICE_YEARS} bonus years if ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}+ years` },
      { symbol: "70", meaning: "Fixed statutory divisor used by EPS 2026 to convert pensionable salary and service into a monthly pension" },
      { symbol: `₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")}`, meaning: "Minimum monthly pension floor for an eligible member at the standard age" },
    ],
  },
  workedExample: epsPensionWorkedExample,
  faqs: epsPensionFAQs,
  relatedCalculators: epsPensionRelatedCalculators,
  metadata: {
    title: "EPS Pension Calculator: Estimate Your EPFO Monthly Pension (EPS 2026)",
    description: `Estimate your monthly EPS 2026 pension using the ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} wage ceiling, the ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus-service rule, and the ₹${EPS_PENSION_MINIMUM_MONTHLY_PENSION.toLocaleString("en-IN")} minimum pension, with an optional early-pension estimate.`,
    keywords: ["eps pension calculator", "eps 2026 pension calculator", "employees pension scheme calculator", "epfo pension calculator", "eps pension formula"],
  },
  status: "published",
} as const satisfies CalculatorDefinition
