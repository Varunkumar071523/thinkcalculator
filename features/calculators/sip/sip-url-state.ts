import { validateSIPInput } from "@/features/calculators/sip/sip-schema"
import type { SIPDurationUnit, SIPInput } from "@/features/calculators/sip/sip-types"
import { buildCalculatorUrl } from "@/lib/calculator-url"

export const SIP_DEFAULT_INPUT: SIPInput = { monthlyInvestment: 10_000, annualReturnRate: 12, duration: 10, durationUnit: "years" }
type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
function read(search: SearchInput, key: string) { const value = search instanceof URLSearchParams ? search.get(key) ?? undefined : search[key]; return Array.isArray(value) ? value[0] : value }
export function parseSIPUrlState(search: SearchInput, defaults: SIPInput = SIP_DEFAULT_INPUT): SIPInput {
  const candidate: SIPInput = { monthlyInvestment: read(search, "monthly") === undefined ? defaults.monthlyInvestment : Number(read(search, "monthly")), annualReturnRate: read(search, "return") === undefined ? defaults.annualReturnRate : Number(read(search, "return")), duration: read(search, "duration") === undefined ? defaults.duration : Number(read(search, "duration")), durationUnit: (read(search, "unit") ?? defaults.durationUnit) as SIPDurationUnit }
  const validation = validateSIPInput(candidate); if (validation.success) return validation.data
  const fallback = { ...candidate, monthlyInvestment: validation.errors.monthlyInvestment ? defaults.monthlyInvestment : candidate.monthlyInvestment, annualReturnRate: validation.errors.annualReturnRate ? defaults.annualReturnRate : candidate.annualReturnRate, duration: validation.errors.duration ? defaults.duration : candidate.duration, durationUnit: validation.errors.durationUnit ? defaults.durationUnit : candidate.durationUnit }
  const checked = validateSIPInput(fallback); return checked.success ? checked.data : defaults
}
export function serializeSIPUrlState(input: SIPInput) { if (!validateSIPInput(input).success) throw new RangeError("Invalid SIP URL state"); return new URLSearchParams({ monthly: String(input.monthlyInvestment), return: String(input.annualReturnRate), duration: String(input.duration), unit: input.durationUnit }) }
export function buildSIPCalculatorUrl(input: SIPInput, origin?: string) { return buildCalculatorUrl("/finance/sip-calculator", Object.fromEntries(serializeSIPUrlState(input)), origin) }
