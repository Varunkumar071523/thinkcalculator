import { describe, expect, it } from "vitest"

import { parseAndValidateCapitalGainsForm, parseCapitalGainsNumericText, validateCapitalGainsInput } from "../capital-gains-schema"
import { CAPITAL_GAINS_DEFAULT_INPUT } from "../capital-gains-url-state"
import type { CapitalGainsFormValues } from "../capital-gains-schema"

function lotFormValues(overrides: Partial<CapitalGainsFormValues["lots"][number]> = {}) {
  return { id: "lot-1", purchaseDate: "2020-01-01", units: "100", costPerUnit: "50", fairMarketValuePerUnitOn31Jan2018: "", ...overrides }
}

function formValues(overrides: Partial<CapitalGainsFormValues> = {}): CapitalGainsFormValues {
  return {
    assetType: "equity-share",
    lots: [lotFormValues()],
    saleDate: "2026-06-15",
    unitsSold: "100",
    salePricePerUnit: "80",
    ...overrides,
  }
}

describe("validateCapitalGainsInput", () => {
  it("accepts the default worked-example input", () => {
    expect(validateCapitalGainsInput(CAPITAL_GAINS_DEFAULT_INPUT).success).toBe(true)
  })

  it("rejects an invalid asset type", () => {
    const result = validateCapitalGainsInput({ ...CAPITAL_GAINS_DEFAULT_INPUT, assetType: "gold" as never })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.assetType).toBeTruthy()
  })

  it("rejects zero lots", () => {
    const result = validateCapitalGainsInput({ ...CAPITAL_GAINS_DEFAULT_INPUT, lots: [] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.lots).toBeTruthy()
  })

  it("rejects units sold exceeding total units held", () => {
    const result = validateCapitalGainsInput({ ...CAPITAL_GAINS_DEFAULT_INPUT, unitsSold: 1_000_000 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.unitsSold).toBeTruthy()
  })

  it("rejects a lot purchased after the sale date", () => {
    const result = validateCapitalGainsInput({
      ...CAPITAL_GAINS_DEFAULT_INPUT,
      lots: [{ id: "future", purchaseDate: "2027-01-01", units: 10, costPerUnit: 5, fairMarketValuePerUnitOn31Jan2018: null }],
      unitsSold: 10,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.lotErrors?.future?.purchaseDate).toBeTruthy()
  })

  it("requires a fair market value for a pre-cutoff lot", () => {
    const result = validateCapitalGainsInput({
      ...CAPITAL_GAINS_DEFAULT_INPUT,
      lots: [{ id: "pre-2018", purchaseDate: "2015-01-01", units: 10, costPerUnit: 5, fairMarketValuePerUnitOn31Jan2018: null }],
      unitsSold: 10,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.lotErrors?.["pre-2018"]?.fairMarketValuePerUnitOn31Jan2018).toBeTruthy()
  })

  it("does not require a fair market value for a post-cutoff lot", () => {
    const result = validateCapitalGainsInput({
      ...CAPITAL_GAINS_DEFAULT_INPUT,
      lots: [{ id: "post-2018", purchaseDate: "2019-01-01", units: 10, costPerUnit: 5, fairMarketValuePerUnitOn31Jan2018: null }],
      unitsSold: 10,
    })
    expect(result.success).toBe(true)
  })
})

describe("parseAndValidateCapitalGainsForm", () => {
  it("parses and validates well-formed form values", () => {
    const result = parseAndValidateCapitalGainsForm(formValues())
    expect(result.success).toBe(true)
  })

  it("rejects non-numeric text in a lot field", () => {
    const result = parseAndValidateCapitalGainsForm(formValues({ lots: [lotFormValues({ units: "abc" })] }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.lotErrors?.["lot-1"]?.units).toBeTruthy()
  })

  it("rejects an unparseable (non-blank) fair market value", () => {
    const result = parseAndValidateCapitalGainsForm(formValues({ lots: [lotFormValues({ purchaseDate: "2015-01-01", fairMarketValuePerUnitOn31Jan2018: "not-a-number" })] }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.lotErrors?.["lot-1"]?.fairMarketValuePerUnitOn31Jan2018).toBeTruthy()
  })

  it("treats a blank fair market value as missing (error) for a pre-cutoff lot via the deeper validation pass", () => {
    const result = parseAndValidateCapitalGainsForm(formValues({ lots: [lotFormValues({ purchaseDate: "2015-01-01", fairMarketValuePerUnitOn31Jan2018: "" })] }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.lotErrors?.["lot-1"]?.fairMarketValuePerUnitOn31Jan2018).toBeTruthy()
  })
})

describe("parseCapitalGainsNumericText", () => {
  it("accepts plain non-negative decimals", () => {
    expect(parseCapitalGainsNumericText("125.5")).toBe(125.5)
    expect(parseCapitalGainsNumericText("0")).toBe(0)
  })

  it("rejects empty strings, whitespace, negatives, and scientific notation", () => {
    expect(parseCapitalGainsNumericText("")).toBeNull()
    expect(parseCapitalGainsNumericText(" 5 ")).toBeNull()
    expect(parseCapitalGainsNumericText("-5")).toBeNull()
    expect(parseCapitalGainsNumericText("1e3")).toBeNull()
  })
})
