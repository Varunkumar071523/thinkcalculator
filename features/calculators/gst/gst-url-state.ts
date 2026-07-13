import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseGSTNumericText, isGSTCalculationMode, isGSTSupplyType, validateGSTInput } from "./gst-schema"
import type { GSTInput } from "./gst-types"

export const GST_DEFAULT_INPUT: GSTInput = { amount: 1_000, gstRate: 18, calculationMode: "add", supplyType: "intra-state" }
type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["amount", "rate", "mode", "supply"] as const

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
  if (search instanceof URLSearchParams) { const values = search.getAll(key); return values.length === 1 ? values[0] : undefined }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidGSTUrlState(search: SearchInput): GSTInput | null {
  const recognised = keys.filter((key) => search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined)
  if (recognised.length !== keys.length) return null
  const amount = parseGSTNumericText(readOne(search, "amount") ?? "")
  const gstRate = parseGSTNumericText(readOne(search, "rate") ?? "")
  const calculationMode = readOne(search, "mode") ?? ""
  const supplyType = readOne(search, "supply") ?? ""
  if (amount === null || gstRate === null || !isGSTCalculationMode(calculationMode) || !isGSTSupplyType(supplyType)) return null
  const validation = validateGSTInput({ amount, gstRate, calculationMode, supplyType })
  return validation.success ? validation.data : null
}

export function parseGSTUrlState(search: SearchInput, defaults: GSTInput = GST_DEFAULT_INPUT): GSTInput { return parseValidGSTUrlState(search) ?? defaults }
export function serializeGSTUrlState(input: GSTInput): URLSearchParams {
  if (!validateGSTInput(input).success) throw new RangeError("Invalid GST URL state")
  return new URLSearchParams({ amount: String(input.amount), rate: String(input.gstRate), mode: input.calculationMode, supply: input.supplyType })
}
export function buildGSTCalculatorUrl(input: GSTInput, origin?: string): string { return buildCalculatorUrl("/business/gst-calculator", Object.fromEntries(serializeGSTUrlState(input)), origin) }
