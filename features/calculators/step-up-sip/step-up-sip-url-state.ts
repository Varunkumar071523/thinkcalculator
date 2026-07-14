import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseStepUpSIPNumericText, validateStepUpSIPInput } from "./step-up-sip-schema"
import type { StepUpMode, StepUpSIPInput } from "./step-up-sip-types"

export const STEP_UP_SIP_DEFAULT_INPUT: StepUpSIPInput = { initialMonthlyInvestment:10_000, stepUpMode:"percentage", annualStepUpValue:10, expectedAnnualReturn:12, durationYears:10 }
type SearchInput = URLSearchParams | Readonly<Record<string,string|string[]|undefined>>
function read(search:SearchInput,key:string){const value=search instanceof URLSearchParams?search.get(key)??undefined:search[key];return Array.isArray(value)?value[0]:value}

export function parseValidStepUpSIPUrlState(search:SearchInput):StepUpSIPInput|null {
  const monthly=read(search,"monthly"), mode=read(search,"mode"), step=read(search,"step"), annualReturn=read(search,"return"), years=read(search,"years")
  if ([monthly,mode,step,annualReturn,years].some(value=>value===undefined)) return null
  const parsed=[parseStepUpSIPNumericText(monthly!),parseStepUpSIPNumericText(step!),parseStepUpSIPNumericText(annualReturn!),parseStepUpSIPNumericText(years!)]
  if (parsed.some(value=>value===null)) return null
  const candidate:StepUpSIPInput={initialMonthlyInvestment:parsed[0]!,stepUpMode:mode as StepUpMode,annualStepUpValue:parsed[1]!,expectedAnnualReturn:parsed[2]!,durationYears:parsed[3]!}
  const validation=validateStepUpSIPInput(candidate)
  return validation.success?validation.data:null
}
export function parseStepUpSIPUrlState(search:SearchInput){return parseValidStepUpSIPUrlState(search)??STEP_UP_SIP_DEFAULT_INPUT}
export function serializeStepUpSIPUrlState(input:StepUpSIPInput){if(!validateStepUpSIPInput(input).success)throw new RangeError("Invalid Step-up SIP URL state");return new URLSearchParams({monthly:String(input.initialMonthlyInvestment),mode:input.stepUpMode,step:String(input.annualStepUpValue),return:String(input.expectedAnnualReturn),years:String(input.durationYears)})}
export function buildStepUpSIPCalculatorUrl(input:StepUpSIPInput,origin?:string){return buildCalculatorUrl("/finance/step-up-sip-calculator",Object.fromEntries(serializeStepUpSIPUrlState(input)),origin)}
