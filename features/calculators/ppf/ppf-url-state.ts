import { buildCalculatorUrl } from "@/lib/calculator-url"
import { PPF_RATE_CONFIG } from "./ppf-rate-config"
import { isPPFDuration, parsePPFNumericText, validatePPFInput } from "./ppf-schema"
import type { PPFInput } from "./ppf-types"

export const PPF_DEFAULT_INPUT: PPFInput = { annualContribution: 100_000, assumedAnnualInterestRate: PPF_RATE_CONFIG.defaultRate, durationYears: 15 }
type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["contribution", "rate", "years"] as const

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
  if (search instanceof URLSearchParams) { const values = search.getAll(key); return values.length === 1 ? values[0] : undefined }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidPPFUrlState(search: SearchInput): PPFInput | null {
  const recognised = keys.filter((key) => search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined)
  if (recognised.length !== keys.length) return null
  const contribution = parsePPFNumericText(readOne(search, "contribution") ?? "")
  const rate = parsePPFNumericText(readOne(search, "rate") ?? "")
  const years = parsePPFNumericText(readOne(search, "years") ?? "")
  if (contribution === null || rate === null || years === null || !isPPFDuration(years)) return null
  const validation = validatePPFInput({ annualContribution: contribution, assumedAnnualInterestRate: rate, durationYears: years })
  return validation.success ? validation.data : null
}

export function parsePPFUrlState(search: SearchInput, defaults: PPFInput = PPF_DEFAULT_INPUT): PPFInput { return parseValidPPFUrlState(search) ?? defaults }
export function serializePPFUrlState(input: PPFInput): URLSearchParams {
  if (!validatePPFInput(input).success) throw new RangeError("Invalid PPF URL state")
  return new URLSearchParams({ contribution: String(input.annualContribution), rate: String(input.assumedAnnualInterestRate), years: String(input.durationYears) })
}
export function buildPPFCalculatorUrl(input: PPFInput, origin?: string): string { return buildCalculatorUrl("/finance/ppf-calculator", Object.fromEntries(serializePPFUrlState(input)), origin) }
