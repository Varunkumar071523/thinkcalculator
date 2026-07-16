import { describe,expect,it } from "vitest"
import { calculateSIP } from "../../sip/calculate-sip"
import { calculateStepUpSIP,contributionForMonth } from "../calculate-step-up-sip"
import type { StepUpSIPInput } from "../step-up-sip-types"

const base:StepUpSIPInput={initialMonthlyInvestment:10_000,stepUpMode:"percentage",annualStepUpValue:10,expectedAnnualReturn:12,durationYears:10}
function independentlyWeightedFutureValue(input:StepUpSIPInput){const months=input.durationYears*12,rate=input.expectedAnnualReturn/12/100;return Array.from({length:months},(_,index)=>contributionForMonth(input,index+1)*Math.pow(1+rate,months-index)).reduce((sum,value)=>sum+value,0)}

describe("calculateStepUpSIP",()=>{
  it("applies percentage increases at month 12/13 and 24/25 boundaries",()=>{expect(contributionForMonth(base,12)).toBe(10_000);expect(contributionForMonth(base,13)).toBeCloseTo(11_000);expect(contributionForMonth(base,24)).toBeCloseTo(11_000);expect(contributionForMonth(base,25)).toBeCloseTo(12_100)})
  it.each([
    {durationYears:1,total:12_000,final:1_000,steps:0},
    {durationYears:2,total:25_200,final:1_100,steps:1},
    {durationYears:3,total:39_720,final:1_210,steps:2},
  ])("matches the independently checked zero-return percentage case $durationYears years",expected=>{const result=calculateStepUpSIP({initialMonthlyInvestment:1_000,stepUpMode:"percentage",annualStepUpValue:10,expectedAnnualReturn:0,durationYears:expected.durationYears});expect(result.totalInvested).toBeCloseTo(expected.total,10);expect(result.estimatedMaturityValue).toBeCloseTo(expected.total,10);expect(result.finalMonthlyInvestment).toBeCloseTo(expected.final,10);expect(result.totalStepUpsApplied).toBe(expected.steps)})
  it("adds a fixed amount once per completed year",()=>{const input={initialMonthlyInvestment:1_000,stepUpMode:"fixed" as const,annualStepUpValue:200,expectedAnnualReturn:0,durationYears:3};const result=calculateStepUpSIP(input);expect(contributionForMonth(input,13)).toBe(1_200);expect(contributionForMonth(input,25)).toBe(1_400);expect(result.totalInvested).toBe(43_200);expect(result.finalMonthlyInvestment).toBe(1_400)})
  it("matches an independently weighted non-zero-return sum",()=>{const input={...base,durationYears:3,expectedAnnualReturn:7.25};expect(calculateStepUpSIP(input).estimatedMaturityValue).toBeCloseTo(independentlyWeightedFutureValue(input),8)})
  it.each([
    {durationYears:1,expectedAnnualReturn:12,initialMonthlyInvestment:10_000},
    {durationYears:2,expectedAnnualReturn:0,initialMonthlyInvestment:500},
    {durationYears:10,expectedAnnualReturn:7.25,initialMonthlyInvestment:25_000},
    {durationYears:50,expectedAnnualReturn:12.5,initialMonthlyInvestment:1_000_000},
  ])("zero step-up matches regular SIP for %o",scenario=>{for(const stepUpMode of ["percentage","fixed"] as const){const input={...scenario,stepUpMode,annualStepUpValue:0};const result=calculateStepUpSIP(input),regular=calculateSIP({monthlyInvestment:scenario.initialMonthlyInvestment,annualReturnRate:scenario.expectedAnnualReturn,duration:scenario.durationYears,durationUnit:"years"});expect(result.totalInvested).toBe(regular.totalInvested);expect(result.estimatedMaturityValue).toBeCloseTo(regular.futureValue,7);expect(result.estimatedReturns).toBeCloseTo(regular.estimatedReturns,7);expect(result.additionalInvestment).toBe(0);expect(result.maturityValueDifference).toBe(0);expect(result.totalStepUpsApplied).toBe(0)}})
  it("reconciles every schedule row and the headline",()=>{const result=calculateStepUpSIP(base);result.schedule.forEach((row,index)=>{expect(row.annualContribution).toBeCloseTo(row.monthlyContributionAtStart*12,8);expect(row.cumulativeInvestment).toBeCloseTo((index?result.schedule[index-1].cumulativeInvestment:0)+row.annualContribution,8);expect(row.estimatedGainToDate).toBeCloseTo(row.estimatedYearEndValue-row.cumulativeInvestment,8)});const last=result.schedule.at(-1)!;expect(last.cumulativeInvestment).toBeCloseTo(result.totalInvested,8);expect(last.estimatedYearEndValue).toBeCloseTo(result.estimatedMaturityValue,8);expect(result.finalMonthlyInvestment).toBe(last.monthlyContributionAtEnd)})
  it("does not round compounded percentage contributions or mutate input",()=>{const input={...base,annualStepUpValue:7.5,durationYears:4};const before={...input},result=calculateStepUpSIP(input);expect(result.finalMonthlyInvestment).toBeCloseTo(10_000*Math.pow(1.075,3),10);expect(input).toEqual(before)})
  it("keeps validated long-duration values finite",()=>{const result=calculateStepUpSIP({...base,annualStepUpValue:25,durationYears:50});expect(Object.values(result).filter(value=>typeof value==="number").every(Number.isFinite)).toBe(true)})
  it("overwrites the same last schedule row (index access) that Array.prototype.at(-1) would have selected, with the exact headline maturity values",()=>{const input={...base,annualStepUpValue:0};const result=calculateStepUpSIP(input);const lastByIndex=result.schedule[result.schedule.length-1];expect(lastByIndex).toBe(result.schedule.at(-1));expect(lastByIndex.estimatedYearEndValue).toBe(result.estimatedMaturityValue);expect(lastByIndex.estimatedGainToDate).toBe(result.estimatedReturns)})
})
