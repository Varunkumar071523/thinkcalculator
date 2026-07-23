import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseEpsPensionNumericText, validateEpsPensionInput } from "./eps-pension-schema"
import type { EpsPensionAgeOption, EpsPensionInput } from "./eps-pension-types"

/** A standard-age example chosen so both the ₹15,000 wage-ceiling cap and the 20-year/2-year
 * bonus-service weightage bind at once — see eps-pension-content.ts's worked example for the
 * component-by-component walk. earlyPensionAge is a valid placeholder value, unused while
 * ageOption is "standard". */
export const EPS_PENSION_DEFAULT_INPUT: EpsPensionInput = {
  averageMonthlySalary: 24_000,
  yearsOfPensionableService: 26,
  ageOption: "standard",
  earlyPensionAge: 50,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["salary", "years", "ageOption", "earlyAge"] as const

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
  if (search instanceof URLSearchParams) {
    const values = search.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidEpsPensionUrlState(search: SearchInput): EpsPensionInput | null {
  const recognised = keys.filter((key) => (search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined))
  if (recognised.length !== keys.length) return null

  const averageMonthlySalary = parseEpsPensionNumericText(readOne(search, "salary") ?? "")
  const yearsOfPensionableService = parseEpsPensionNumericText(readOne(search, "years") ?? "")
  const ageOption = readOne(search, "ageOption") as EpsPensionAgeOption | undefined
  const earlyPensionAge = parseEpsPensionNumericText(readOne(search, "earlyAge") ?? "")

  if (
    averageMonthlySalary === null
    || yearsOfPensionableService === null
    || !ageOption
    || earlyPensionAge === null
  ) return null

  const validation = validateEpsPensionInput({
    averageMonthlySalary,
    yearsOfPensionableService,
    ageOption,
    earlyPensionAge,
  })
  return validation.success ? validation.data : null
}

export function parseEpsPensionUrlState(search: SearchInput, defaults: EpsPensionInput = EPS_PENSION_DEFAULT_INPUT): EpsPensionInput {
  return parseValidEpsPensionUrlState(search) ?? defaults
}

export function serializeEpsPensionUrlState(input: EpsPensionInput): URLSearchParams {
  if (!validateEpsPensionInput(input).success) throw new RangeError("Invalid EPS pension URL state")
  return new URLSearchParams({
    salary: String(input.averageMonthlySalary),
    years: String(input.yearsOfPensionableService),
    ageOption: input.ageOption,
    earlyAge: String(input.earlyPensionAge),
  })
}

export function buildEpsPensionCalculatorUrl(input: EpsPensionInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/eps-pension-calculator",
    Object.fromEntries(serializeEpsPensionUrlState(input)),
    origin,
  )
}
