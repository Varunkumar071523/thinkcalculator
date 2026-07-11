import { describe, expect, it } from "vitest"
import { buildEMICalculatorUrl, EMI_DEFAULT_INPUT, parseEMIUrlState, serializeEMIUrlState } from "@/features/calculators/emi/emi-url-state"

describe("EMI URL state", () => {
  it("parses valid years parameters and a decimal rate", () => expect(parseEMIUrlState(new URLSearchParams("amount=2500000&rate=8.5&tenure=20&unit=years"))).toEqual(EMI_DEFAULT_INPUT))
  it("parses valid months parameters", () => expect(parseEMIUrlState(new URLSearchParams("amount=500000&rate=10.25&tenure=36&unit=months"))).toEqual({ principalAmount: 500000, annualInterestRate: 10.25, tenure: 36, tenureUnit: "months" }))
  it("uses defaults for missing parameters", () => expect(parseEMIUrlState(new URLSearchParams())).toEqual(EMI_DEFAULT_INPUT))
  it("falls back only invalid values", () => expect(parseEMIUrlState(new URLSearchParams("amount=-1&rate=9&tenure=15&unit=years"))).toEqual({ ...EMI_DEFAULT_INPUT, annualInterestRate: 9, tenure: 15 }))
  it.each(["amount=2500000&rate=31&tenure=20&unit=years", "amount=2500000&rate=8.5&tenure=20&unit=weeks", "amount=Infinity&rate=8.5&tenure=20&unit=years"])("falls back for invalid state: %s", (query) => expect(parseEMIUrlState(new URLSearchParams(query))).toEqual(EMI_DEFAULT_INPUT))
  it("serializes valid input", () => expect(serializeEMIUrlState(EMI_DEFAULT_INPUT).toString()).toBe("amount=2500000&rate=8.5&tenure=20&unit=years"))
  it("builds a canonical share URL", () => expect(buildEMICalculatorUrl(EMI_DEFAULT_INPUT, "https://thinkcalculator.in")).toBe("https://thinkcalculator.in/finance/emi-calculator?amount=2500000&rate=8.5&tenure=20&unit=years"))
  it("round trips", () => expect(parseEMIUrlState(serializeEMIUrlState(EMI_DEFAULT_INPUT))).toEqual(EMI_DEFAULT_INPUT))
})
