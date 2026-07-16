import { describe,expect,it } from "vitest"
import { calculateSWP,generateSWPMonthlySchedule,SWP_MAX_SIMULATION_MONTHS } from "../calculate-swp"
import type { SWPInput } from "../swp-types"

const base:SWPInput={initialInvestment:5_000_000,monthlyWithdrawal:35_000,expectedAnnualReturn:8,withdrawalMode:"fixedDuration",durationYears:20}

// Independent closed-form cross-check for the "withdraw first, then grow" recurrence B_m = (B_{m-1} - W) * (1 + r),
// derived algebraically and implemented separately from the iterative production code, valid only while the
// balance never reaches zero within the simulated months (so the partial-withdrawal clamp never activates).
function independentBalanceAfterMonths(initial:number,withdrawal:number,monthlyRate:number,months:number){
  if (monthlyRate===0) return initial-withdrawal*months
  const growthFactor=Math.pow(1+monthlyRate,months)
  return growthFactor*initial-withdrawal*(1+monthlyRate)*(growthFactor-1)/monthlyRate
}

describe("calculateSWP",()=>{
  it("reconciles total withdrawn, remaining balance, and total growth against the initial investment",()=>{
    const scenarios:SWPInput[]=[
      base,
      {...base,expectedAnnualReturn:0},
      {...base,monthlyWithdrawal:80_000,durationYears:5},
      {initialInvestment:1_000_000,monthlyWithdrawal:1_000,expectedAnnualReturn:12,withdrawalMode:"untilExhausted",durationYears:1},
      {initialInvestment:100_000,monthlyWithdrawal:50_000,expectedAnnualReturn:6,withdrawalMode:"untilExhausted",durationYears:1},
    ]
    for (const scenario of scenarios) {
      const result=calculateSWP(scenario)
      expect(result.totalWithdrawn+result.remainingBalance-scenario.initialInvestment).toBeCloseTo(result.totalGrowth,6)
      const scheduleWithdrawn=result.schedule.reduce((sum,row)=>sum+row.withdrawalsInYear,0)
      const scheduleGrowth=result.schedule.reduce((sum,row)=>sum+row.growthInYear,0)
      expect(scheduleWithdrawn).toBeCloseTo(result.totalWithdrawn,6)
      expect(scheduleGrowth).toBeCloseTo(result.totalGrowth,6)
      expect(result.schedule.at(-1)?.closingBalance).toBeCloseTo(result.remainingBalance,6)
    }
  })

  it("matches an independently derived closed-form balance when the corpus is never exhausted",()=>{
    const input:SWPInput={initialInvestment:2_000_000,monthlyWithdrawal:15_000,expectedAnnualReturn:9,withdrawalMode:"fixedDuration",durationYears:5}
    const result=calculateSWP(input)
    expect(result.isExhausted).toBe(false)
    const expected=independentBalanceAfterMonths(input.initialInvestment,input.monthlyWithdrawal,input.expectedAnnualReturn/12/100,60)
    expect(result.remainingBalance).toBeCloseTo(expected,4)
  })

  it("depletes linearly and exhausts exactly at the boundary month with a zero return rate",()=>{
    const input:SWPInput={initialInvestment:120_000,monthlyWithdrawal:10_000,expectedAnnualReturn:0,withdrawalMode:"fixedDuration",durationYears:1}
    const result=calculateSWP(input)
    expect(result.totalGrowth).toBe(0)
    expect(result.totalWithdrawn).toBe(120_000)
    expect(result.remainingBalance).toBe(0)
    expect(result.isExhausted).toBe(true)
    expect(result.exhaustionMonth).toBe(12)
    expect(result.finalWithdrawalAmount).toBe(10_000)
    const monthly=generateSWPMonthlySchedule(input)
    expect(monthly).toHaveLength(12)
    expect(monthly.map((row)=>row.closingBalance)).toEqual([110_000,100_000,90_000,80_000,70_000,60_000,50_000,40_000,30_000,20_000,10_000,0])
  })

  it("withdraws only the available balance and reports exhaustion when the amount exceeds sustainable growth",()=>{
    const input:SWPInput={initialInvestment:100_000,monthlyWithdrawal:50_000,expectedAnnualReturn:6,withdrawalMode:"untilExhausted",durationYears:1}
    const result=calculateSWP(input)
    expect(result.isExhausted).toBe(true)
    expect(result.exhaustionMonth).toBe(3)
    expect(result.monthsSimulated).toBe(3)
    expect(result.finalWithdrawalAmount).toBeCloseTo(251.25,2)
    expect(result.finalWithdrawalAmount).toBeLessThan(input.monthlyWithdrawal)
    expect(result.remainingBalance).toBe(0)
    expect(result.cappedAtMaxDuration).toBe(false)
  })

  it("caps an unexhausted 'until exhausted' projection at 100 years instead of running forever",()=>{
    const input:SWPInput={initialInvestment:1_000_000,monthlyWithdrawal:1_000,expectedAnnualReturn:12,withdrawalMode:"untilExhausted",durationYears:1}
    const result=calculateSWP(input)
    expect(result.isExhausted).toBe(false)
    expect(result.exhaustionMonth).toBeNull()
    expect(result.cappedAtMaxDuration).toBe(true)
    expect(result.monthsSimulated).toBe(SWP_MAX_SIMULATION_MONTHS)
    expect(result.schedule).toHaveLength(SWP_MAX_SIMULATION_MONTHS/12)
    expect(Number.isFinite(result.remainingBalance)).toBe(true)
  })

  it("keeps a fixed-duration schedule at the full selected length with zero rows after exhaustion",()=>{
    const input:SWPInput={initialInvestment:120_000,monthlyWithdrawal:10_000,expectedAnnualReturn:0,withdrawalMode:"fixedDuration",durationYears:2}
    const result=calculateSWP(input)
    expect(result.monthsSimulated).toBe(24)
    expect(result.schedule).toHaveLength(2)
    expect(result.schedule[1]).toMatchObject({withdrawalsInYear:0,growthInYear:0,closingBalance:0})
    expect(result.schedule[0].isExhaustionYear).toBe(true)
    expect(result.schedule[1].isExhaustionYear).toBe(false)
  })

  it("keeps long-duration and maximum-rate combinations finite and does not mutate input",()=>{
    const input={...base,expectedAnnualReturn:50,durationYears:50}
    const before={...input}
    const result=calculateSWP(input)
    expect(Object.values(result).filter((value)=>typeof value==="number").every(Number.isFinite)).toBe(true)
    expect(input).toEqual(before)
    const untilExhausted:SWPInput={initialInvestment:100_000_000,monthlyWithdrawal:100,expectedAnnualReturn:50,withdrawalMode:"untilExhausted",durationYears:1}
    const cappedResult=calculateSWP(untilExhausted)
    expect(Object.values(cappedResult).filter((value)=>typeof value==="number").every(Number.isFinite)).toBe(true)
  })

  it("does not round intermediate growth or withdrawal values",()=>{
    const input:SWPInput={initialInvestment:1_234_567,monthlyWithdrawal:12_345,expectedAnnualReturn:7.25,withdrawalMode:"fixedDuration",durationYears:1}
    const monthly=generateSWPMonthlySchedule(input)
    const rate=input.expectedAnnualReturn/12/100
    expect(monthly[0].growth).toBeCloseTo((input.initialInvestment-input.monthlyWithdrawal)*rate,10)
  })

  it("computes finalWithdrawalAmount identically to Array.prototype.findLast, for a schedule with trailing zero-withdrawal rows after exhaustion",()=>{
    const input:SWPInput={initialInvestment:120_000,monthlyWithdrawal:10_000,expectedAnnualReturn:0,withdrawalMode:"fixedDuration",durationYears:2}
    const result=calculateSWP(input)
    const monthly=generateSWPMonthlySchedule(input)
    const expected=monthly.findLast((row)=>row.withdrawal>0)?.withdrawal ?? 0
    expect(result.finalWithdrawalAmount).toBe(expected)
    expect(result.finalWithdrawalAmount).toBe(10_000)
  })

  it("rejects invalid input",()=>{
    expect(()=>calculateSWP({...base,initialInvestment:0})).toThrow(RangeError)
    expect(()=>calculateSWP({...base,withdrawalMode:"other" as never})).toThrow(RangeError)
  })
})
