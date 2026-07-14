import { calculateSIP } from "../sip/calculate-sip"
import { validateStepUpSIPInput } from "./step-up-sip-schema"
import type { StepUpSIPInput, StepUpSIPResult, StepUpSIPScheduleRow } from "./step-up-sip-types"

export function contributionForMonth(input:StepUpSIPInput,month:number){const year=Math.floor((month-1)/12);return input.stepUpMode==="percentage"?input.initialMonthlyInvestment*Math.pow(1+input.annualStepUpValue/100,year):input.initialMonthlyInvestment+input.annualStepUpValue*year}
const zeroIfNegligible=(value:number)=>Math.abs(value)<1e-7?0:value

export function calculateStepUpSIP(input:StepUpSIPInput):StepUpSIPResult {
  if(!validateStepUpSIPInput(input).success) throw new RangeError("Invalid Step-up SIP input")
  const months=input.durationYears*12, rate=input.expectedAnnualReturn/12/100
  let value=0, invested=0, yearContribution=0
  const schedule:StepUpSIPScheduleRow[]=[]
  for(let month=1;month<=months;month++){
    const contribution=contributionForMonth(input,month)
    invested+=contribution;yearContribution+=contribution
    // Matches calculateSIP: the beginning-of-month contribution is added before monthly growth.
    value=(value+contribution)*(1+rate)
    if(month%12===0){schedule.push({year:month/12,monthlyContributionAtStart:contributionForMonth(input,month-11),monthlyContributionAtEnd:contribution,annualContribution:yearContribution,cumulativeInvestment:invested,estimatedYearEndValue:value,estimatedGainToDate:value-invested,stepUpApplied:month>12&&input.annualStepUpValue>0});yearContribution=0}
  }
  const regular=calculateSIP({monthlyInvestment:input.initialMonthlyInvestment,annualReturnRate:input.expectedAnnualReturn,duration:input.durationYears,durationUnit:"years"})
  const maturityValue=input.annualStepUpValue===0?regular.futureValue:value
  if(input.annualStepUpValue===0){const last=schedule.at(-1)!;schedule[schedule.length-1]={...last,estimatedYearEndValue:maturityValue,estimatedGainToDate:maturityValue-invested}}
  const maturityDifference=zeroIfNegligible(maturityValue-regular.futureValue)
  const result={totalInvested:invested,estimatedReturns:maturityValue-invested,estimatedMaturityValue:maturityValue,finalMonthlyInvestment:contributionForMonth(input,months),totalContributions:months,totalStepUpsApplied:input.annualStepUpValue===0?0:input.durationYears-1,regularSipTotalInvested:regular.totalInvested,regularSipEstimatedReturns:regular.estimatedReturns,regularSipMaturityValue:regular.futureValue,additionalInvestment:invested-regular.totalInvested,additionalEstimatedValue:maturityDifference,maturityValueDifference:maturityDifference,schedule}
  if(!Object.values(result).filter(v=>typeof v==="number").every(Number.isFinite)) throw new RangeError("Step-up SIP calculation produced a non-finite result")
  return result
}
