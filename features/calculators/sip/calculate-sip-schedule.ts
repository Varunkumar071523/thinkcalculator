import { calculateSIP } from "@/features/calculators/sip/calculate-sip"
import type { SIPInput, SIPScheduleRow } from "@/features/calculators/sip/sip-types"

function rowMonths(totalMonths:number,unit:SIPInput["durationUnit"]){const step=unit==="years"||totalMonths>24?12:1;const points:number[]=[];for(let month=step;month<totalMonths;month+=step)points.push(month);points.push(totalMonths);return points}
export function calculateSIPSchedule(input:SIPInput):readonly SIPScheduleRow[]{const result=calculateSIP(input);return rowMonths(result.totalMonths,input.durationUnit).map((monthsElapsed,index)=>{const investedAmount=input.monthlyInvestment*monthsElapsed;const futureValue=result.monthlyRate===0?investedAmount:input.monthlyInvestment*((Math.pow(1+result.monthlyRate,monthsElapsed)-1)/result.monthlyRate)*(1+result.monthlyRate);return{periodNumber:index+1,monthsElapsed,investedAmount,estimatedReturns:futureValue-investedAmount,futureValue}})}
