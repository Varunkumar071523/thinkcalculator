import { describe, expect, it } from "vitest"

import { runUrlRestoreIfAllowed } from "@/features/calculators/core/use-calculator-url-restore"
import { INCOME_TAX_DEFAULT_FORM_VALUES } from "../income-tax-schema"
import type { IncomeTaxFormValues } from "../income-tax-types"
import { applyHraExemptionPassThrough, parseIncomeTaxUrlState } from "../income-tax-url-state"

/**
 * Regression test for the mount-time race found in Sprint 26's adversarial review: landing via
 * the HRA calculator's pass-through link (?hraExemption=...), then editing another field before
 * the deferred URL-state restore ran, silently discarded the typed edit — `setValues(parsedValues)`
 * unconditionally replaced the whole form-values object rather than merging. Reproduced directly
 * against the running app: typing "999999" into Gross Income landed as "1275000" (the hardcoded
 * default) with no visual indication anything had happened.
 *
 * This exercises `runUrlRestoreIfAllowed` — the exact function `IncomeTaxCalculator`'s mount
 * effect calls via `useCalculatorUrlRestore` — composed with the same production
 * `parseIncomeTaxUrlState` / `applyHraExemptionPassThrough` functions the component itself uses,
 * so it proves the real restore logic, not a re-implementation of it. It is deterministic by
 * construction: "the user edited before restore" is expressed as a boolean passed directly to
 * `runUrlRestoreIfAllowed`, not as real timing that depends on scheduler speed or CPU load — which
 * is exactly why the original bug was only ever caught under unusual load.
 */
function simulateMount(search: URLSearchParams, userEditsBeforeRestoreSettles: boolean) {
  let values: IncomeTaxFormValues = INCOME_TAX_DEFAULT_FORM_VALUES
  let hraPassThroughAmount: number | null = null

  // "the user immediately types into Gross Income" — happens synchronously, before the deferred
  // mount-effect restore fires, exactly as in the reproduced bug.
  if (userEditsBeforeRestoreSettles) {
    values = { ...values, grossIncome: "999999" }
  }

  // The same function the real mount effect calls, gated by whether the user has interacted.
  runUrlRestoreIfAllowed(userEditsBeforeRestoreSettles, () => {
    const applied = applyHraExemptionPassThrough(parseIncomeTaxUrlState(search), search)
    values = applied.values
    hraPassThroughAmount = applied.hraPassThroughAmount
  })

  return { values, hraPassThroughAmount }
}

describe("income tax calculator mount-restore race (HRA pass-through)", () => {
  const passThroughSearch = new URLSearchParams({ hraExemption: "120000" })

  it("with no concurrent edit: forces Old Regime and pre-fills the HRA exemption from the pass-through link", () => {
    const { values, hraPassThroughAmount } = simulateMount(passThroughSearch, false)
    expect(values.regime).toBe("old")
    expect(values.oldRegimeDeductions.hraExemption).toBe("120000")
    expect(hraPassThroughAmount).toBe(120_000)
  })

  it("with a concurrent edit before restore settles: the typed value survives, and the restore is skipped rather than silently overwriting it", () => {
    const { values, hraPassThroughAmount } = simulateMount(passThroughSearch, true)
    // The exact failure mode reproduced against the running app: grossIncome must stay "999999",
    // not silently revert to INCOME_TAX_DEFAULT_FORM_VALUES.grossIncome ("1275000").
    expect(values.grossIncome).toBe("999999")
    expect(values.grossIncome).not.toBe(INCOME_TAX_DEFAULT_FORM_VALUES.grossIncome)
    // The restore never ran, so the pass-through amount was never resolved — this is the correct,
    // safe outcome for this window (the user gets what they typed rather than a silent partial
    // merge); the guard exists to prevent an overwrite, not to guarantee both win at once.
    expect(hraPassThroughAmount).toBeNull()
  })
})
