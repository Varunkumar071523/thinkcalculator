import { parseCAGRNumericText, validateCAGRInput } from "@/features/calculators/cagr/cagr-schema"
import type { CAGRInput } from "@/features/calculators/cagr/cagr-types"
import { buildCalculatorUrl } from "@/lib/calculator-url"

export const CAGR_DEFAULT_INPUT: CAGRInput = {
  beginningValue: 100_000,
  endingValue: 161_051,
  investmentPeriodYears: 5,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["beginning", "ending", "years"] as const

function readExactlyOne(search: SearchInput, key: typeof keys[number]): string | undefined {
  if (search instanceof URLSearchParams) {
    const values = search.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidCAGRUrlState(search: SearchInput): CAGRInput | null {
  const beginningText = readExactlyOne(search, "beginning")
  const endingText = readExactlyOne(search, "ending")
  const yearsText = readExactlyOne(search, "years")
  const recognisedCount = keys.filter((key) => search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined).length
  if (recognisedCount !== keys.length || beginningText === undefined || endingText === undefined || yearsText === undefined) return null

  const beginningValue = parseCAGRNumericText(beginningText)
  const endingValue = parseCAGRNumericText(endingText)
  const investmentPeriodYears = parseCAGRNumericText(yearsText)
  if (beginningValue === null || endingValue === null || investmentPeriodYears === null) return null
  const candidate: CAGRInput = { beginningValue, endingValue, investmentPeriodYears }
  const validation = validateCAGRInput(candidate)
  return validation.success ? validation.data : null
}

export function parseCAGRUrlState(search: SearchInput, defaults: CAGRInput = CAGR_DEFAULT_INPUT): CAGRInput {
  return parseValidCAGRUrlState(search) ?? defaults
}

export function serializeCAGRUrlState(input: CAGRInput): URLSearchParams {
  if (!validateCAGRInput(input).success) throw new RangeError("Invalid CAGR URL state")
  return new URLSearchParams({
    beginning: String(input.beginningValue),
    ending: String(input.endingValue),
    years: String(input.investmentPeriodYears),
  })
}

export function buildCAGRCalculatorUrl(input: CAGRInput, origin?: string): string {
  return buildCalculatorUrl("/finance/cagr-calculator", Object.fromEntries(serializeCAGRUrlState(input)), origin)
}
