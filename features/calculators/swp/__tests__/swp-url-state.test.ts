import { describe,expect,it } from "vitest"
import { parseSWPUrlState,parseValidSWPUrlState,serializeSWPUrlState,SWP_DEFAULT_INPUT } from "../swp-url-state"
const input={initialInvestment:5_000_000,monthlyWithdrawal:35_000,expectedAnnualReturn:8,withdrawalMode:"fixedDuration" as const,durationYears:20}
describe("SWP URL state",()=>{
  it("round trips both withdrawal modes",()=>{for(const candidate of [input,{...input,withdrawalMode:"untilExhausted" as const}])expect(parseValidSWPUrlState(serializeSWPUrlState(candidate))).toEqual(candidate)})
  it.each(["initial=5000000","initial=5000000&withdrawal=35000&return=8&mode=x&years=20","initial=5e6&withdrawal=35000&return=8&mode=fixedDuration&years=20","initial=5000000&withdrawal=%20&return=8&mode=fixedDuration&years=20","initial=5000000&withdrawal=-1&return=8&mode=fixedDuration&years=20","initial=5000000&withdrawal=35000&return=8&mode=fixedDuration&years=1.5"])("rejects partial or malformed state: %s",query=>expect(parseValidSWPUrlState(new URLSearchParams(query))).toBeNull())
  it("ignores unknown keys and uses a whole-state default for invalid URLs",()=>{const query=serializeSWPUrlState(input);query.set("unknown","x");expect(parseValidSWPUrlState(query)).toEqual(input);expect(parseSWPUrlState(new URLSearchParams("initial=5000000"))).toEqual(SWP_DEFAULT_INPUT)})
  it("serializes fields in deterministic order",()=>{expect([...serializeSWPUrlState(input).keys()]).toEqual(["initial","withdrawal","return","mode","years"])})
  it("throws when serializing invalid input",()=>{expect(()=>serializeSWPUrlState({...input,initialInvestment:0})).toThrow(RangeError)})
})
