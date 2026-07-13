import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseGratuityNumericText, validateGratuityInput } from "./gratuity-schema"
import type { GratuityInput } from "./gratuity-types"

export const GRATUITY_DEFAULT_INPUT: GratuityInput = {
  eligibleMonthlyWages: 50_000,
  completedYears: 7,
  additionalMonths: 7,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["wages", "years", "months"] as const

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
  if (search instanceof URLSearchParams) {
    const values = search.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidGratuityUrlState(search: SearchInput): GratuityInput | null {
  const recognised = keys.filter((key) => search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined)
  if (recognised.length !== keys.length) return null

  const eligibleMonthlyWages = parseGratuityNumericText(readOne(search, "wages") ?? "")
  const completedYears = parseGratuityNumericText(readOne(search, "years") ?? "")
  const additionalMonths = parseGratuityNumericText(readOne(search, "months") ?? "")
  if (eligibleMonthlyWages === null || completedYears === null || additionalMonths === null) return null

  const validation = validateGratuityInput({ eligibleMonthlyWages, completedYears, additionalMonths })
  return validation.success ? validation.data : null
}

export function parseGratuityUrlState(search: SearchInput, defaults: GratuityInput = GRATUITY_DEFAULT_INPUT): GratuityInput {
  return parseValidGratuityUrlState(search) ?? defaults
}

export function serializeGratuityUrlState(input: GratuityInput): URLSearchParams {
  if (!validateGratuityInput(input).success) throw new RangeError("Invalid gratuity URL state")
  return new URLSearchParams({
    wages: String(input.eligibleMonthlyWages),
    years: String(input.completedYears),
    months: String(input.additionalMonths),
  })
}

export function buildGratuityCalculatorUrl(input: GratuityInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/gratuity-calculator",
    Object.fromEntries(serializeGratuityUrlState(input)),
    origin,
  )
}
