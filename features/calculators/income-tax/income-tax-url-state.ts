import { buildCalculatorUrl } from "@/lib/calculator-url"
import { validateTaxCalcInput } from "@/lib/tax/validation"
import type { TaxCalcInput } from "@/lib/tax/types"
import { isAgeBand, isTaxRegime, INCOME_TAX_DEFAULT_FORM_VALUES } from "./income-tax-schema"
import { INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"
import type { IncomeTaxFormValues } from "./income-tax-types"

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>

const sharedKeys = ["regime", "income", "age"] as const
const oldKeys = ["c80", "d80", "hra", "hli24b", "other80"] as const
const newKeys = ["nps"] as const

function has(search: SearchInput, key: string): boolean {
  return search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined
}

function readOne(search: SearchInput, key: string): string | undefined {
  if (search instanceof URLSearchParams) {
    const values = search.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

function parseAmount(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Reconstructs a full `TaxCalcInput` from a share link only when every key
 * for the encoded regime is present and passes the same
 * `validateTaxCalcInput` the engine and form both use — a partial or
 * tampered URL falls back to `null` (and the caller uses form defaults)
 * rather than guessing at missing values.
 */
export function parseValidIncomeTaxUrlState(search: SearchInput): TaxCalcInput | null {
  if (!sharedKeys.every((key) => has(search, key))) return null

  const regime = readOne(search, "regime") ?? ""
  const grossIncome = parseAmount(readOne(search, "income"))
  const ageBand = readOne(search, "age") ?? ""
  if (grossIncome === null || !isAgeBand(ageBand) || !isTaxRegime(regime)) return null

  if (regime === "old") {
    if (!oldKeys.every((key) => has(search, key))) return null
    const section80C = parseAmount(readOne(search, "c80"))
    const section80D = parseAmount(readOne(search, "d80"))
    const hraExemption = parseAmount(readOne(search, "hra"))
    const homeLoanInterestSection24b = parseAmount(readOne(search, "hli24b"))
    const otherSection80Deductions = parseAmount(readOne(search, "other80"))
    if (section80C === null || section80D === null || hraExemption === null || homeLoanInterestSection24b === null || otherSection80Deductions === null) {
      return null
    }
    const input: TaxCalcInput = {
      regime: "old",
      grossIncome,
      ageBand,
      deductions: { section80C, section80D, hraExemption, homeLoanInterestSection24b, otherSection80Deductions },
    }
    const validation = validateTaxCalcInput(input, INCOME_TAX_RULE_SET)
    return validation.success ? validation.data : null
  }

  if (!newKeys.every((key) => has(search, key))) return null
  const employerNpsSection80CCD2 = parseAmount(readOne(search, "nps"))
  if (employerNpsSection80CCD2 === null) return null
  const input: TaxCalcInput = { regime: "new", grossIncome, ageBand, deductions: { employerNpsSection80CCD2 } }
  const validation = validateTaxCalcInput(input, INCOME_TAX_RULE_SET)
  return validation.success ? validation.data : null
}

/**
 * Converts a validated `TaxCalcInput` into full form values, keeping the
 * non-active regime's deduction buffer at its defaults — a share link only
 * ever carries one regime's deductions, so the other bucket has nothing to
 * restore from.
 */
function taxCalcInputToFormValues(input: TaxCalcInput): IncomeTaxFormValues {
  if (input.regime === "old") {
    return {
      regime: "old",
      grossIncome: String(input.grossIncome),
      ageBand: input.ageBand,
      oldRegimeDeductions: {
        section80C: String(input.deductions.section80C),
        section80D: String(input.deductions.section80D),
        hraExemption: String(input.deductions.hraExemption),
        homeLoanInterestSection24b: String(input.deductions.homeLoanInterestSection24b),
        otherSection80Deductions: String(input.deductions.otherSection80Deductions),
      },
      newRegimeDeductions: INCOME_TAX_DEFAULT_FORM_VALUES.newRegimeDeductions,
    }
  }
  return {
    regime: "new",
    grossIncome: String(input.grossIncome),
    ageBand: input.ageBand,
    oldRegimeDeductions: INCOME_TAX_DEFAULT_FORM_VALUES.oldRegimeDeductions,
    newRegimeDeductions: { employerNpsSection80CCD2: String(input.deductions.employerNpsSection80CCD2) },
  }
}

export function parseIncomeTaxUrlState(search: SearchInput, defaults: IncomeTaxFormValues = INCOME_TAX_DEFAULT_FORM_VALUES): IncomeTaxFormValues {
  const validInput = parseValidIncomeTaxUrlState(search)
  return validInput ? taxCalcInputToFormValues(validInput) : defaults
}

export function serializeIncomeTaxUrlState(input: TaxCalcInput): URLSearchParams {
  const validation = validateTaxCalcInput(input, INCOME_TAX_RULE_SET)
  if (!validation.success) throw new RangeError("Invalid income tax URL state")

  const shared = { regime: input.regime, income: String(input.grossIncome), age: input.ageBand }
  if (input.regime === "old") {
    return new URLSearchParams({
      ...shared,
      c80: String(input.deductions.section80C),
      d80: String(input.deductions.section80D),
      hra: String(input.deductions.hraExemption),
      hli24b: String(input.deductions.homeLoanInterestSection24b),
      other80: String(input.deductions.otherSection80Deductions),
    })
  }
  return new URLSearchParams({ ...shared, nps: String(input.deductions.employerNpsSection80CCD2) })
}

export function buildIncomeTaxCalculatorUrl(input: TaxCalcInput, origin?: string): string {
  return buildCalculatorUrl("/finance/income-tax-calculator", Object.fromEntries(serializeIncomeTaxUrlState(input)), origin)
}

/**
 * Reads the `hraExemption` query param used by the HRA calculator's "Use
 * this in the Income Tax Calculator" link
 * (features/calculators/hra/hra-url-state.ts). Deliberately not imported
 * from that module — every calculator links to another calculator's route
 * as a plain string contract (see e.g. income-tax-content.ts's related-
 * calculator hrefs), not by importing that calculator's feature module, so
 * the two calculators stay independent. Returns `null` for a missing,
 * non-numeric, or negative value so a malformed link is silently ignored
 * rather than producing a bad pre-fill.
 */
export function parseHraExemptionPassThrough(search: SearchInput): number | null {
  const amount = parseAmount(readOne(search, "hraExemption"))
  return amount === null || amount < 0 ? null : amount
}

/**
 * Applies an `hraExemption` pass-through, if present in `search`, on top of
 * already-resolved form values: forces the old regime (see
 * `parseHraExemptionPassThrough`'s doc comment — HRA exemption is old-
 * regime-only) and overwrites only the `hraExemption` field within the old-
 * regime deductions bucket, leaving every other field — including the new-
 * regime deductions bucket — untouched. Returns the pass-through amount
 * alongside the merged values so the caller can surface the arrival note.
 * Pulled out of the calculator component so this merge can be unit-tested
 * directly against `TaxCalcInput`'s discriminated union, rather than only
 * through a rendered form.
 */
export function applyHraExemptionPassThrough(
  values: IncomeTaxFormValues,
  search: SearchInput,
): { readonly values: IncomeTaxFormValues; readonly hraPassThroughAmount: number | null } {
  const hraPassThroughAmount = parseHraExemptionPassThrough(search)
  if (hraPassThroughAmount === null) return { values, hraPassThroughAmount: null }

  return {
    values: {
      ...values,
      regime: "old",
      oldRegimeDeductions: { ...values.oldRegimeDeductions, hraExemption: String(hraPassThroughAmount) },
    },
    hraPassThroughAmount,
  }
}
