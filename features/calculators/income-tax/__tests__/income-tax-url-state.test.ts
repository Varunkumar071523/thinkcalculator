import { describe, expect, it } from "vitest"

import { calculateIncomeTax } from "@/lib/tax/engine"
import type { TaxCalcInput } from "@/lib/tax/types"
import { INCOME_TAX_DEFAULT_FORM_VALUES } from "../income-tax-schema"
import { INCOME_TAX_FINANCIAL_YEAR } from "../income-tax-regulatory-config"
import { buildIncomeTaxCalculatorUrl, parseIncomeTaxUrlState, parseValidIncomeTaxUrlState, serializeIncomeTaxUrlState } from "../income-tax-url-state"

const oldInput: TaxCalcInput = {
  regime: "old",
  grossIncome: 1_000_000,
  ageBand: "below60",
  deductions: { section80C: 150_000, section80D: 25_000, hraExemption: 50_000, homeLoanInterestSection24b: 200_000, otherSection80Deductions: 10_000 },
}

const newInput: TaxCalcInput = {
  regime: "new",
  grossIncome: 1_275_000,
  ageBand: "below60",
  deductions: { employerNpsSection80CCD2: 0 },
}

describe("income tax URL state", () => {
  it("round-trips a valid old-regime share link", () => {
    const serialized = serializeIncomeTaxUrlState(oldInput)
    expect(parseValidIncomeTaxUrlState(serialized)).toEqual(oldInput)
  })

  it("round-trips a valid new-regime share link", () => {
    const serialized = serializeIncomeTaxUrlState(newInput)
    expect(parseValidIncomeTaxUrlState(serialized)).toEqual(newInput)
  })

  it("only serializes the active regime's deduction keys", () => {
    expect([...serializeIncomeTaxUrlState(oldInput).keys()]).toEqual(["regime", "income", "age", "c80", "d80", "hra", "hli24b", "other80"])
    expect([...serializeIncomeTaxUrlState(newInput).keys()]).toEqual(["regime", "income", "age", "nps"])
  })

  it("returns null for a missing regime-specific key (old regime, missing 80C)", () => {
    const search = serializeIncomeTaxUrlState(oldInput)
    search.delete("c80")
    expect(parseValidIncomeTaxUrlState(search)).toBeNull()
  })

  it("returns null for a missing shared key", () => {
    const search = serializeIncomeTaxUrlState(newInput)
    search.delete("income")
    expect(parseValidIncomeTaxUrlState(search)).toBeNull()
  })

  it("returns null for an unrecognized regime value", () => {
    expect(parseValidIncomeTaxUrlState(new URLSearchParams("regime=other&income=1000000&age=below60"))).toBeNull()
  })

  it("returns null when a deduction exceeds its statutory cap (a hand-crafted or tampered link)", () => {
    const search = serializeIncomeTaxUrlState(oldInput)
    search.set("c80", "500000")
    expect(parseValidIncomeTaxUrlState(search)).toBeNull()
  })

  it("falls back to defaults for an incomplete URL", () => {
    expect(parseIncomeTaxUrlState(new URLSearchParams())).toEqual(INCOME_TAX_DEFAULT_FORM_VALUES)
  })

  it("populates only the active regime's bucket from the URL, leaving the other at defaults", () => {
    const values = parseIncomeTaxUrlState(serializeIncomeTaxUrlState(oldInput))
    expect(values.regime).toBe("old")
    expect(values.oldRegimeDeductions).toEqual({ section80C: "150000", section80D: "25000", hraExemption: "50000", homeLoanInterestSection24b: "200000", otherSection80Deductions: "10000" })
    expect(values.newRegimeDeductions).toEqual(INCOME_TAX_DEFAULT_FORM_VALUES.newRegimeDeductions)
  })

  it("builds a canonical share URL", () => {
    expect(buildIncomeTaxCalculatorUrl(newInput)).toBe("/finance/income-tax-calculator?regime=new&income=1275000&age=below60&nps=0")
  })

  it("rejects invalid state during serialization", () => {
    expect(() => serializeIncomeTaxUrlState({ ...newInput, grossIncome: -1 })).toThrow(RangeError)
  })

  it("reproduces shared calculation output through a round trip", () => {
    const parsed = parseValidIncomeTaxUrlState(serializeIncomeTaxUrlState(oldInput))!
    expect(calculateIncomeTax(parsed, INCOME_TAX_FINANCIAL_YEAR)).toEqual(calculateIncomeTax(oldInput, INCOME_TAX_FINANCIAL_YEAR))
  })
})
