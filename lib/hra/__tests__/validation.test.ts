import { describe, expect, it } from "vitest"

import type { HraCalcInput } from "../types"
import { validateHraCalcInput } from "../validation"

const valid: HraCalcInput = {
  basicSalary: 600_000,
  da: 0,
  hraReceived: 300_000,
  rentPaid: 240_000,
  city: "metro",
}

describe("validateHraCalcInput", () => {
  it("accepts valid input", () => {
    expect(validateHraCalcInput(valid).success).toBe(true)
  })

  it("accepts a non-metro city", () => {
    expect(validateHraCalcInput({ ...valid, city: "non-metro" }).success).toBe(true)
  })

  it("rejects negative basic salary", () => {
    const result = validateHraCalcInput({ ...valid, basicSalary: -1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.basicSalary).toBeDefined()
  })

  it("rejects non-finite basic salary", () => {
    const result = validateHraCalcInput({ ...valid, basicSalary: Number.NaN })
    expect(result.success).toBe(false)
  })

  it("rejects negative DA", () => {
    const result = validateHraCalcInput({ ...valid, da: -1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.da).toBeDefined()
  })

  it("rejects negative HRA received", () => {
    const result = validateHraCalcInput({ ...valid, hraReceived: -1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.hraReceived).toBeDefined()
  })

  it("rejects negative rent paid", () => {
    const result = validateHraCalcInput({ ...valid, rentPaid: -1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.rentPaid).toBeDefined()
  })

  it("accepts zero rent paid and zero HRA received", () => {
    expect(validateHraCalcInput({ ...valid, rentPaid: 0 }).success).toBe(true)
    expect(validateHraCalcInput({ ...valid, hraReceived: 0 }).success).toBe(true)
  })

  it("rejects an invalid city", () => {
    const result = validateHraCalcInput({ ...valid, city: "suburb" as never })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.city).toBeDefined()
  })

  it("rejects amounts above the ₹1 lakh crore sanity ceiling", () => {
    const result = validateHraCalcInput({ ...valid, hraReceived: 2_000_000_000_000 })
    expect(result.success).toBe(false)
  })
})
