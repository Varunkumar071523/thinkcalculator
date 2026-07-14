import { describe,expect,it } from "vitest"
import { parseInflationUrlState,parseValidInflationUrlState,serializeInflationUrlState,INFLATION_DEFAULT_INPUT } from "../inflation-url-state"
const input={mode:"futureCost" as const,amount:100_000,annualInflationRate:6,years:10}
describe("Inflation URL state",()=>{
  it("round trips both modes and a negative rate",()=>{for(const candidate of [input,{...input,mode:"presentValue" as const},{...input,annualInflationRate:-5}])expect(parseValidInflationUrlState(serializeInflationUrlState(candidate))).toEqual(candidate)})
  it.each(["mode=futureCost","mode=x&amount=100000&rate=6&years=10","mode=futureCost&amount=1e5&rate=6&years=10","mode=futureCost&amount=100000&rate=%20&years=10","mode=futureCost&amount=-1&rate=6&years=10","mode=futureCost&amount=100000&rate=6&years=1.5"])("rejects partial or malformed state: %s",query=>expect(parseValidInflationUrlState(new URLSearchParams(query))).toBeNull())
  it("ignores unknown keys and uses a whole-state default for invalid URLs",()=>{const query=serializeInflationUrlState(input);query.set("unknown","x");expect(parseValidInflationUrlState(query)).toEqual(input);expect(parseInflationUrlState(new URLSearchParams("mode=futureCost"))).toEqual(INFLATION_DEFAULT_INPUT)})
  it("serializes fields in deterministic order",()=>{expect([...serializeInflationUrlState(input).keys()]).toEqual(["mode","amount","rate","years"])})
  it("throws when serializing invalid input",()=>{expect(()=>serializeInflationUrlState({...input,amount:0})).toThrow(RangeError)})
})
