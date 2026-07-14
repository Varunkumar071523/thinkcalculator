import { describe,expect,it } from "vitest"
import { parseStepUpSIPUrlState,parseValidStepUpSIPUrlState,serializeStepUpSIPUrlState,STEP_UP_SIP_DEFAULT_INPUT } from "../step-up-sip-url-state"
const input={initialMonthlyInvestment:10_000,stepUpMode:"percentage" as const,annualStepUpValue:10,expectedAnnualReturn:12,durationYears:10}
describe("Step-up SIP URL state",()=>{
  it("round trips percentage, fixed, and zero step-up modes",()=>{for(const candidate of [input,{...input,stepUpMode:"fixed" as const,annualStepUpValue:1000},{...input,annualStepUpValue:0}])expect(parseValidStepUpSIPUrlState(serializeStepUpSIPUrlState(candidate))).toEqual(candidate)})
  it.each(["monthly=10000","monthly=10000&mode=x&step=10&return=12&years=10","monthly=1e4&mode=percentage&step=10&return=12&years=10","monthly=10000&mode=percentage&step=%20&return=12&years=10","monthly=10000&mode=percentage&step=-1&return=12&years=10","monthly=10000&mode=percentage&step=10&return=12&years=1.5"])("rejects partial or malformed state: %s",query=>expect(parseValidStepUpSIPUrlState(new URLSearchParams(query))).toBeNull())
  it("ignores unknown keys and uses a whole-state default for invalid URLs",()=>{const query=serializeStepUpSIPUrlState(input);query.set("unknown","x");expect(parseValidStepUpSIPUrlState(query)).toEqual(input);expect(parseStepUpSIPUrlState(new URLSearchParams("monthly=10000"))).toEqual(STEP_UP_SIP_DEFAULT_INPUT)})
  it("serializes only the active mode's single step value in deterministic order",()=>{expect([...serializeStepUpSIPUrlState(input).keys()]).toEqual(["monthly","mode","step","return","years"])})
})
