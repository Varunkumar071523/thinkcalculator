import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseSWPNumericText, validateSWPInput } from "./swp-schema"
import type { SWPInput, SWPWithdrawalMode } from "./swp-types"

export const SWP_DEFAULT_INPUT: SWPInput = { initialInvestment:5_000_000, monthlyWithdrawal:35_000, expectedAnnualReturn:8, withdrawalMode:"fixedDuration", durationYears:20 }
type SearchInput = URLSearchParams | Readonly<Record<string,string|string[]|undefined>>
function read(search:SearchInput,key:string){const value=search instanceof URLSearchParams?search.get(key)??undefined:search[key];return Array.isArray(value)?value[0]:value}

export function parseValidSWPUrlState(search:SearchInput):SWPInput|null {
  const initial=read(search,"initial"), withdrawal=read(search,"withdrawal"), annualReturn=read(search,"return"), mode=read(search,"mode"), years=read(search,"years")
  if ([initial,withdrawal,annualReturn,mode,years].some(value=>value===undefined)) return null
  const parsed=[parseSWPNumericText(initial!),parseSWPNumericText(withdrawal!),parseSWPNumericText(annualReturn!),parseSWPNumericText(years!)]
  if (parsed.some(value=>value===null)) return null
  const candidate:SWPInput={initialInvestment:parsed[0]!,monthlyWithdrawal:parsed[1]!,expectedAnnualReturn:parsed[2]!,withdrawalMode:mode as SWPWithdrawalMode,durationYears:parsed[3]!}
  const validation=validateSWPInput(candidate)
  return validation.success?validation.data:null
}
export function parseSWPUrlState(search:SearchInput){return parseValidSWPUrlState(search)??SWP_DEFAULT_INPUT}
export function serializeSWPUrlState(input:SWPInput){if(!validateSWPInput(input).success)throw new RangeError("Invalid SWP URL state");return new URLSearchParams({initial:String(input.initialInvestment),withdrawal:String(input.monthlyWithdrawal),return:String(input.expectedAnnualReturn),mode:input.withdrawalMode,years:String(input.durationYears)})}
export function buildSWPCalculatorUrl(input:SWPInput,origin?:string){return buildCalculatorUrl("/finance/swp-calculator",Object.fromEntries(serializeSWPUrlState(input)),origin)}
