import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseInflationNumericText, validateInflationInput } from "./inflation-schema"
import type { InflationInput, InflationMode } from "./inflation-types"

export const INFLATION_DEFAULT_INPUT: InflationInput = { mode:"futureCost", amount:100_000, annualInflationRate:6, years:10 }
type SearchInput = URLSearchParams | Readonly<Record<string,string|string[]|undefined>>
function read(search:SearchInput,key:string){const value=search instanceof URLSearchParams?search.get(key)??undefined:search[key];return Array.isArray(value)?value[0]:value}

export function parseValidInflationUrlState(search:SearchInput):InflationInput|null {
  const mode=read(search,"mode"), amount=read(search,"amount"), rate=read(search,"rate"), years=read(search,"years")
  if ([mode,amount,rate,years].some(value=>value===undefined)) return null
  const parsed=[parseInflationNumericText(amount!),parseInflationNumericText(rate!),parseInflationNumericText(years!)]
  if (parsed.some(value=>value===null)) return null
  const candidate:InflationInput={mode:mode as InflationMode,amount:parsed[0]!,annualInflationRate:parsed[1]!,years:parsed[2]!}
  const validation=validateInflationInput(candidate)
  return validation.success?validation.data:null
}
export function parseInflationUrlState(search:SearchInput){return parseValidInflationUrlState(search)??INFLATION_DEFAULT_INPUT}
export function serializeInflationUrlState(input:InflationInput){if(!validateInflationInput(input).success)throw new RangeError("Invalid Inflation URL state");return new URLSearchParams({mode:input.mode,amount:String(input.amount),rate:String(input.annualInflationRate),years:String(input.years)})}
export function buildInflationCalculatorUrl(input:InflationInput,origin?:string){return buildCalculatorUrl("/finance/inflation-calculator",Object.fromEntries(serializeInflationUrlState(input)),origin)}
