import { describe, expect, it } from "vitest"
import {
  buildHomeLoanEligibilityCalculatorUrl,
  HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT,
  parseHomeLoanEligibilityUrlState,
  serializeHomeLoanEligibilityUrlState,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-url-state"

describe("Home Loan Eligibility URL state", () => {
  it("parses valid parameters", () => expect(parseHomeLoanEligibilityUrlState(new URLSearchParams("income=100000&existingEmi=10000&rate=8.5&tenure=20&contribution=1000000&foir=standard"))).toEqual(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))
  it("parses a different FOIR band and tenure", () => expect(parseHomeLoanEligibilityUrlState(new URLSearchParams("income=150000&existingEmi=0&rate=9&tenure=15&contribution=500000&foir=aggressive"))).toEqual({ netMonthlyIncome: 150000, existingMonthlyEMI: 0, annualInterestRate: 9, tenureYears: 15, ownContribution: 500000, foirBand: "aggressive" }))
  it("uses defaults for missing parameters", () => expect(parseHomeLoanEligibilityUrlState(new URLSearchParams())).toEqual(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))
  it("falls back only invalid values", () => expect(parseHomeLoanEligibilityUrlState(new URLSearchParams("income=-1&existingEmi=10000&rate=9&tenure=15&contribution=1000000&foir=standard"))).toEqual({ ...HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT, annualInterestRate: 9, tenureYears: 15 }))
  it.each([
    "income=100000&existingEmi=10000&rate=21&tenure=20&contribution=1000000&foir=standard",
    "income=100000&existingEmi=10000&rate=8.5&tenure=20&contribution=1000000&foir=extreme",
    "income=Infinity&existingEmi=10000&rate=8.5&tenure=20&contribution=1000000&foir=standard",
  ])("falls back for invalid state: %s", (query) => expect(parseHomeLoanEligibilityUrlState(new URLSearchParams(query))).toEqual(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))
  it("serializes valid input", () => expect(serializeHomeLoanEligibilityUrlState(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT).toString()).toBe("income=100000&existingEmi=10000&rate=8.5&tenure=20&contribution=1000000&foir=standard"))
  it("builds a canonical share URL", () => expect(buildHomeLoanEligibilityCalculatorUrl(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT, "https://thinkcalculator.in")).toBe("https://thinkcalculator.in/finance/home-loan-eligibility-calculator?income=100000&existingEmi=10000&rate=8.5&tenure=20&contribution=1000000&foir=standard"))
  it("round trips", () => expect(parseHomeLoanEligibilityUrlState(serializeHomeLoanEligibilityUrlState(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))).toEqual(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))
})
