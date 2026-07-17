import { buildCalculatorUrl } from "@/lib/calculator-url"
import type { HraCalcInput } from "@/lib/hra/types"
import { isHraCity, validateHraCalcInput } from "@/lib/hra/validation"
import { HRA_DEFAULT_FORM_VALUES } from "./hra-schema"
import type { HraFormValues } from "./hra-types"

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["basic", "da", "hra", "rent", "city"] as const

function has(search: SearchInput, key: string): boolean {
  return search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined
}

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
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

export function parseValidHraUrlState(search: SearchInput): HraCalcInput | null {
  if (!keys.every((key) => has(search, key))) return null

  const basicSalary = parseAmount(readOne(search, "basic"))
  const da = parseAmount(readOne(search, "da"))
  const hraReceived = parseAmount(readOne(search, "hra"))
  const rentPaid = parseAmount(readOne(search, "rent"))
  const city = readOne(search, "city") ?? ""
  if (basicSalary === null || da === null || hraReceived === null || rentPaid === null || !isHraCity(city)) {
    return null
  }

  const input: HraCalcInput = { basicSalary, da, hraReceived, rentPaid, city }
  const validation = validateHraCalcInput(input)
  return validation.success ? validation.data : null
}

function hraCalcInputToFormValues(input: HraCalcInput): HraFormValues {
  return {
    basicSalary: String(input.basicSalary),
    da: String(input.da),
    hraReceived: String(input.hraReceived),
    rentPaid: String(input.rentPaid),
    city: input.city,
  }
}

export function parseHraUrlState(search: SearchInput, defaults: HraFormValues = HRA_DEFAULT_FORM_VALUES): HraFormValues {
  const validInput = parseValidHraUrlState(search)
  return validInput ? hraCalcInputToFormValues(validInput) : defaults
}

export function serializeHraUrlState(input: HraCalcInput): URLSearchParams {
  if (!validateHraCalcInput(input).success) throw new RangeError("Invalid HRA URL state")
  return new URLSearchParams({
    basic: String(input.basicSalary),
    da: String(input.da),
    hra: String(input.hraReceived),
    rent: String(input.rentPaid),
    city: input.city,
  })
}

export function buildHraCalculatorUrl(input: HraCalcInput, origin?: string): string {
  return buildCalculatorUrl("/finance/hra-calculator", Object.fromEntries(serializeHraUrlState(input)), origin)
}

/**
 * Query parameter contract for handing a computed exemption to the income
 * tax calculator: a single `hraExemption` amount on
 * `/finance/income-tax-calculator`. Deliberately a standalone contract
 * rather than a shared import — every other calculator page links to
 * another calculator's route as a plain string (see e.g.
 * `gratuity-content.ts`'s related-calculator hrefs), not by importing that
 * calculator's feature module, so the two calculators stay independent.
 * `features/calculators/income-tax/income-tax-url-state.ts` reads this same
 * `hraExemption` key on arrival.
 */
export const HRA_PASS_THROUGH_QUERY_KEY = "hraExemption"

export function buildIncomeTaxPassThroughUrl(exemptHra: number, origin?: string): string {
  return buildCalculatorUrl("/finance/income-tax-calculator", { [HRA_PASS_THROUGH_QUERY_KEY]: String(exemptHra) }, origin)
}
