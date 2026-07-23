import { describe, expect, it } from "vitest"

import { calculateEpsPension } from "../calculate-eps-pension"
import { toLiveInput } from "../eps-pension-live-input"
import { validateEpsPensionInput } from "../eps-pension-schema"
import type { EpsPensionFormValues } from "../eps-pension-schema"
import { EPS_PENSION_DEFAULT_INPUT } from "../eps-pension-url-state"

const validText: EpsPensionFormValues = {
  averageMonthlySalary: "24000",
  yearsOfPensionableService: "26",
  ageOption: "standard",
  earlyPensionAge: "50",
}

describe("EPS pension toLiveInput defensive clamping", () => {
  it("passes valid text through unchanged", () => {
    expect(toLiveInput(validText)).toEqual(EPS_PENSION_DEFAULT_INPUT)
  })

  it("falls back to the default for empty, NaN, or malformed text on every numeric field", () => {
    const numericFields = ["averageMonthlySalary", "yearsOfPensionableService", "earlyPensionAge"] as const
    for (const field of numericFields) {
      for (const malformed of ["", "abc", "NaN", "Infinity", "-1e10"]) {
        const input = toLiveInput({ ...validText, [field]: malformed })
        expect(Number.isFinite(input[field]), `${field}="${malformed}" produced a non-finite live value`).toBe(true)
      }
    }
  })

  it("falls back to the default age option for an unrecognised value", () => {
    expect(toLiveInput({ ...validText, ageOption: "deferred" }).ageOption).toBe(EPS_PENSION_DEFAULT_INPUT.ageOption)
    expect(toLiveInput({ ...validText, ageOption: "" }).ageOption).toBe(EPS_PENSION_DEFAULT_INPUT.ageOption)
    expect(toLiveInput({ ...validText, ageOption: "early" }).ageOption).toBe("early")
  })

  it("clamps a below-minimum value up to the field's minimum", () => {
    const input = toLiveInput({ ...validText, yearsOfPensionableService: "-5", earlyPensionAge: "10" })
    expect(input.yearsOfPensionableService).toBe(0)
    expect(input.earlyPensionAge).toBe(50)
  })

  it("clamps an above-maximum value down to the field's maximum", () => {
    const input = toLiveInput({ ...validText, averageMonthlySalary: "999999999999", yearsOfPensionableService: "999", earlyPensionAge: "999" })
    expect(input.averageMonthlySalary).toBe(10_000_000)
    expect(input.yearsOfPensionableService).toBe(60)
    expect(input.earlyPensionAge).toBe(57)
  })

  it("rounds fractional year/age counts to whole numbers", () => {
    const input = toLiveInput({ ...validText, yearsOfPensionableService: "25.6", earlyPensionAge: "52.4" })
    expect(input.yearsOfPensionableService).toBe(26)
    expect(input.earlyPensionAge).toBe(52)
  })

  it("handles zero salary and zero service years at the slider minimum without producing NaN", () => {
    const input = toLiveInput({ ...validText, averageMonthlySalary: "0", yearsOfPensionableService: "0" })
    expect(validateEpsPensionInput(input).success).toBe(true)
    const result = calculateEpsPension(input)
    expect(result.isEligible).toBe(false)
    expect(result.monthlyPension).toBe(0)
    expect(Number.isFinite(result.monthlyPension)).toBe(true)
  })

  it("always produces a fully valid, calculable input regardless of raw text extremes (the core defensive-clamp guarantee)", () => {
    const extremeCombinations: readonly Partial<EpsPensionFormValues>[] = [
      { averageMonthlySalary: "-1", yearsOfPensionableService: "-1", earlyPensionAge: "-1" },
      { averageMonthlySalary: "1e20", yearsOfPensionableService: "999", earlyPensionAge: "999" },
      { yearsOfPensionableService: "0", averageMonthlySalary: "0" },
      { ageOption: "not-an-option", earlyPensionAge: "999" },
      { averageMonthlySalary: "", yearsOfPensionableService: "", ageOption: "", earlyPensionAge: "" },
    ]
    for (const overrides of extremeCombinations) {
      const input = toLiveInput({ ...validText, ...overrides })
      const validation = validateEpsPensionInput(input)
      expect(validation.success, `toLiveInput(${JSON.stringify(overrides)}) => ${JSON.stringify(input)} failed validation`).toBe(true)
      expect(() => calculateEpsPension(input)).not.toThrow()
      const result = calculateEpsPension(input)
      expect(result.monthlyPension).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(result.monthlyPension)).toBe(true)
    }
  })

  it("falls back to EPS_PENSION_DEFAULT_INPUT's values when every field is malformed", () => {
    const input = toLiveInput({
      averageMonthlySalary: "x",
      yearsOfPensionableService: "x",
      ageOption: "x",
      earlyPensionAge: "x",
    })
    expect(input).toEqual(EPS_PENSION_DEFAULT_INPUT)
  })
})
