import { describe,expect,it } from "vitest"
import { calculateInflation,calculateInflationFutureCost,calculateInflationPresentValue } from "../calculate-inflation"
import type { InflationInput } from "../inflation-types"

const futureCostBase:InflationInput={mode:"futureCost",amount:100_000,annualInflationRate:6,years:10}
const presentValueBase:InflationInput={mode:"presentValue",amount:100_000,annualInflationRate:6,years:10}

// Independent closed-form cross-check: computes (1 + rate/100) ** years via repeated multiplication in a
// loop, a code path deliberately separate from the Math.pow call used in calculate-inflation.ts.
function independentCompoundFactor(annualInflationRate:number,years:number){
  let factor=1
  for(let year=0;year<years;year++) factor*=1+annualInflationRate/100
  return factor
}

describe("calculateInflationFutureCost",()=>{
  it("matches an independently derived compounding factor",()=>{
    for (const scenario of [futureCostBase,{...futureCostBase,annualInflationRate:0},{...futureCostBase,annualInflationRate:-4},{...futureCostBase,annualInflationRate:50,years:15},{...futureCostBase,years:1},{...futureCostBase,years:30}]) {
      const result=calculateInflationFutureCost(scenario)
      const expectedFactor=independentCompoundFactor(scenario.annualInflationRate,scenario.years)
      expect(result.inflationMultiple).toBeCloseTo(expectedFactor,10)
      expect(result.futureValue).toBeCloseTo(scenario.amount*expectedFactor,6)
    }
  })

  it("leaves the amount unchanged at 0% inflation with no distortion",()=>{
    const result=calculateInflationFutureCost({...futureCostBase,annualInflationRate:0})
    expect(result.futureValue).toBe(result.currentAmount)
    expect(result.totalInflationImpact).toBe(0)
    expect(result.inflationMultiple).toBe(1)
    expect(result.schedule.every((row)=>row.equivalentValue===result.currentAmount)).toBe(true)
  })

  it("correctly decreases the future cost under deflation",()=>{
    const result=calculateInflationFutureCost({...futureCostBase,annualInflationRate:-5})
    expect(result.futureValue).toBeLessThan(result.currentAmount)
    expect(result.totalInflationImpact).toBeLessThan(0)
    expect(result.inflationMultiple).toBeCloseTo(Math.pow(0.95,10),10)
  })

  it("compounds exactly once for a 1-year duration",()=>{
    const result=calculateInflationFutureCost({...futureCostBase,years:1})
    expect(result.futureValue).toBeCloseTo(futureCostBase.amount*1.06,10)
    expect(result.schedule).toHaveLength(1)
  })

  it("handles a very high inflation stress case and stays finite",()=>{
    const result=calculateInflationFutureCost({mode:"futureCost",amount:50_000,annualInflationRate:50,years:20})
    expect(Number.isFinite(result.futureValue)).toBe(true)
    expect(result.futureValue).toBeGreaterThan(result.currentAmount*1000)
  })

  it("stays finite over a long duration and does not mutate input",()=>{
    const input={...futureCostBase,years:50}
    const before={...input}
    const result=calculateInflationFutureCost(input)
    expect(Object.values(result).filter((value)=>typeof value==="number").every(Number.isFinite)).toBe(true)
    expect(input).toEqual(before)
  })

  it("rejects a combination that would grow beyond a safe calculation range",()=>{
    expect(()=>calculateInflationFutureCost({mode:"futureCost",amount:100_000_000,annualInflationRate:50,years:50})).toThrow(RangeError)
  })

  it("reconciles every schedule row against the same compounding factor",()=>{
    const result=calculateInflationFutureCost(futureCostBase)
    result.schedule.forEach((row,index)=>{
      expect(row.year).toBe(index+1)
      expect(row.cumulativeFactor).toBeCloseTo(independentCompoundFactor(futureCostBase.annualInflationRate,row.year),10)
      expect(row.equivalentValue).toBeCloseTo(futureCostBase.amount*row.cumulativeFactor,6)
    })
    expect(result.schedule.at(-1)?.equivalentValue).toBeCloseTo(result.futureValue,6)
  })
})

describe("calculateInflationPresentValue",()=>{
  it("matches an independently derived discount factor",()=>{
    for (const scenario of [presentValueBase,{...presentValueBase,annualInflationRate:0},{...presentValueBase,annualInflationRate:-4},{...presentValueBase,annualInflationRate:50,years:15},{...presentValueBase,years:1},{...presentValueBase,years:30}]) {
      const result=calculateInflationPresentValue(scenario)
      const expectedFactor=1/independentCompoundFactor(scenario.annualInflationRate,scenario.years)
      expect(result.discountMultiple).toBeCloseTo(expectedFactor,10)
      expect(result.presentValue).toBeCloseTo(scenario.amount*expectedFactor,6)
    }
  })

  it("leaves the amount unchanged at 0% inflation with no distortion",()=>{
    const result=calculateInflationPresentValue({...presentValueBase,annualInflationRate:0})
    expect(result.presentValue).toBe(result.futureAmount)
    expect(result.purchasingPowerChange).toBe(0)
    expect(result.purchasingPowerChangePercentage).toBe(0)
    expect(result.discountMultiple).toBe(1)
  })

  it("correctly increases present value under deflation (a purchasing-power gain)",()=>{
    const result=calculateInflationPresentValue({...presentValueBase,annualInflationRate:-5})
    expect(result.presentValue).toBeGreaterThan(result.futureAmount)
    expect(result.purchasingPowerChange).toBeLessThan(0)
    expect(result.discountMultiple).toBeCloseTo(1/Math.pow(0.95,10),10)
  })

  it("handles a very high inflation stress case and stays finite",()=>{
    const result=calculateInflationPresentValue({mode:"presentValue",amount:50_000,annualInflationRate:50,years:20})
    expect(Number.isFinite(result.presentValue)).toBe(true)
    expect(result.presentValue).toBeLessThan(result.futureAmount)
    expect(result.purchasingPowerChangePercentage).toBeGreaterThan(99)
  })

  it("stays finite over a long duration and does not mutate input",()=>{
    const input={...presentValueBase,years:50}
    const before={...input}
    const result=calculateInflationPresentValue(input)
    expect(Object.values(result).filter((value)=>typeof value==="number").every(Number.isFinite)).toBe(true)
    expect(input).toEqual(before)
  })

  it("reconciles every schedule row against the same discount factor",()=>{
    const result=calculateInflationPresentValue(presentValueBase)
    result.schedule.forEach((row,index)=>{
      expect(row.year).toBe(index+1)
      expect(row.cumulativeFactor).toBeCloseTo(1/independentCompoundFactor(presentValueBase.annualInflationRate,row.year),10)
      expect(row.equivalentValue).toBeCloseTo(presentValueBase.amount*row.cumulativeFactor,6)
    })
    expect(result.schedule.at(-1)?.equivalentValue).toBeCloseTo(result.presentValue,6)
  })
})

describe("calculateInflation (mode dispatch)",()=>{
  it("dispatches to the correct mode-specific function",()=>{
    expect(calculateInflation(futureCostBase)).toEqual(calculateInflationFutureCost(futureCostBase))
    expect(calculateInflation(presentValueBase)).toEqual(calculateInflationPresentValue(presentValueBase))
  })

  it.each([
    { annualInflationRate:0.001 },
    { years:2 },
  ])("round-trips future cost and present value for the same rate/duration %o",(overrides)=>{
    const scenario={annualInflationRate:6,years:10,...overrides}
    const future=calculateInflationFutureCost({mode:"futureCost",amount:100_000,...scenario})
    const roundTripped=calculateInflationPresentValue({mode:"presentValue",amount:future.futureValue,...scenario})
    expect(roundTripped.presentValue).toBeCloseTo(100_000,6)
  })

  it("rejects invalid input",()=>{
    expect(()=>calculateInflation({...futureCostBase,amount:0})).toThrow(RangeError)
    expect(()=>calculateInflation({...futureCostBase,mode:"other" as never})).toThrow(RangeError)
  })
})
