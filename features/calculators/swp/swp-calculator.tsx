"use client"
import { useEffect,useState,type FormEvent } from "react"
import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable,type DataTableColumn } from "@/components/calculators/data-table"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard,CalculatorShell } from "@/features/calculators/core"
import { formatIndianCurrency,formatPercentage } from "@/lib/formatters"
import type { CalculatorResultItem } from "@/types/calculator"
import { calculateSWP } from "./calculate-swp"
import { parseAndValidateSWPForm,SWP_LIMITS,type SWPFormValues } from "./swp-schema"
import type { SWPInput,SWPResult,SWPValidationErrors,SWPYearlyScheduleRow } from "./swp-types"
import { buildSWPCalculatorUrl,parseSWPUrlState,parseValidSWPUrlState,SWP_DEFAULT_INPUT } from "./swp-url-state"

const toForm=(input:SWPInput):SWPFormValues=>({initialInvestment:String(input.initialInvestment),monthlyWithdrawal:String(input.monthlyWithdrawal),expectedAnnualReturn:String(input.expectedAnnualReturn),withdrawalMode:input.withdrawalMode,durationYears:String(input.durationYears)})
function formatDurationText(months:number){const years=Math.floor(months/12),remainder=months%12;if(years===0)return `${remainder} month${remainder===1?"":"s"}`;if(remainder===0)return `${years} year${years===1?"":"s"}`;return `${years} year${years===1?"":"s"} ${remainder} month${remainder===1?"":"s"}`}
const resultItems=(result:SWPResult):readonly CalculatorResultItem[]=>{
  const items:CalculatorResultItem[]=result.isExhausted
    ?[{id:"exhaustion",label:"Balance exhausted after",value:formatDurationText(result.exhaustionMonth!),displayType:"text",isPrimary:true},{id:"remaining",label:"Remaining balance",value:result.remainingBalance,displayType:"currency"}]
    :[{id:"remaining",label:result.cappedAtMaxDuration?"Remaining balance at the 100-year cap":"Remaining balance",value:result.remainingBalance,displayType:"currency",isPrimary:true}]
  return [...items,
    {id:"withdrawn",label:"Total withdrawn",value:result.totalWithdrawn,displayType:"currency"},
    {id:"growth",label:"Total growth",value:result.totalGrowth,displayType:"currency"},
    {id:"final-withdrawal",label:"Final withdrawal amount",value:result.finalWithdrawalAmount,displayType:"currency"},
    {id:"duration",label:"Duration simulated",value:formatDurationText(result.monthsSimulated),displayType:"text"},
  ]
}
const columns:readonly DataTableColumn<SWPYearlyScheduleRow>[]=[{header:"Year",cell:row=>row.year},{header:"Opening balance",cell:row=>formatIndianCurrency(row.openingBalance)},{header:"Withdrawals in year",cell:row=>formatIndianCurrency(row.withdrawalsInYear)},{header:"Growth in year",cell:row=>formatIndianCurrency(row.growthInYear)},{header:"Closing balance",cell:row=>row.isExhaustionYear?`${formatIndianCurrency(row.closingBalance)} (exhausted)`:formatIndianCurrency(row.closingBalance)}]

export function SWPCalculator(){
  const[values,setValues]=useState(()=>toForm(SWP_DEFAULT_INPUT))
  const[errors,setErrors]=useState<SWPValidationErrors>({})
  const[calculation,setCalculation]=useState<{input:SWPInput;result:SWPResult;date:string}|null>(null)
  useEffect(()=>{const timer=setTimeout(()=>{const search=new URLSearchParams(location.search),input=parseSWPUrlState(search),shared=parseValidSWPUrlState(search);setValues(toForm(input));if(shared)setCalculation({input:shared,result:calculateSWP(shared),date:new Intl.DateTimeFormat("en-IN",{dateStyle:"long"}).format(new Date())})},0);return()=>clearTimeout(timer)},[])
  function update(field:keyof SWPFormValues,value:string){
    setValues(current=>({...current,[field]:value}))
    setErrors(current=>({...current,[field]:undefined}))
    setCalculation(null)
  }
  function submit(event:FormEvent){event.preventDefault();const validation=parseAndValidateSWPForm(values);if(!validation.success){setErrors(validation.errors);setCalculation(null);return}const result=calculateSWP(validation.data);setErrors({});setCalculation({input:validation.data,result,date:new Intl.DateTimeFormat("en-IN",{dateStyle:"long"}).format(new Date())});history.replaceState(null,"",buildSWPCalculatorUrl(validation.data))}
  function reset(){setValues(toForm(SWP_DEFAULT_INPUT));setErrors({});setCalculation(null);history.replaceState(null,"","/finance/swp-calculator")}
  const copiedText=calculation?["ThinkCalculator SWP Estimate",`Initial investment: ${formatIndianCurrency(calculation.input.initialInvestment)}`,`Monthly withdrawal: ${formatIndianCurrency(calculation.input.monthlyWithdrawal)}`,`Expected annual return assumption: ${formatPercentage(calculation.input.expectedAnnualReturn)}`,`Withdrawal duration: ${calculation.input.withdrawalMode==="fixedDuration"?`${calculation.input.durationYears} years, fixed`:"Until balance is exhausted"}`,`Total withdrawn: ${formatIndianCurrency(calculation.result.totalWithdrawn)}`,`Total growth: ${formatIndianCurrency(calculation.result.totalGrowth)}`,`Remaining balance: ${formatIndianCurrency(calculation.result.remainingBalance)}`,`Balance exhausted: ${calculation.result.isExhausted?`Yes, after ${formatDurationText(calculation.result.exhaustionMonth!)}`:"No"}`,calculation.result.cappedAtMaxDuration?"Note: the balance was not exhausted within the 100-year simulation cap.":"","Returns are market-linked estimates and are not guaranteed. This projection excludes taxation of withdrawals and product-specific rules."].filter(Boolean).join("\n"):""
  return <>
    <div data-calculator-form><CalculatorShell title="Estimate an SWP" description="Withdraw a fixed monthly amount from an investment and see how the balance declines."><form className="space-y-5" onSubmit={submit} noValidate>
      <CalculatorNumberInput id="initial" label="Initial investment" prefix="₹" min={SWP_LIMITS.initialInvestment.min} max={SWP_LIMITS.initialInvestment.max} step={10_000} value={values.initialInvestment} onValueChange={value=>update("initialInvestment",value)} error={errors.initialInvestment} required/>
      <CalculatorNumberInput id="withdrawal" label="Monthly withdrawal" prefix="₹" min={SWP_LIMITS.monthlyWithdrawal.min} max={SWP_LIMITS.monthlyWithdrawal.max} step={500} value={values.monthlyWithdrawal} onValueChange={value=>update("monthlyWithdrawal",value)} error={errors.monthlyWithdrawal} required/>
      <CalculatorNumberInput id="return" label="Expected annual return assumption" description="A constant modelling assumption for this scenario, not a forecast or guaranteed return." suffix="%" min={SWP_LIMITS.expectedAnnualReturn.min} max={SWP_LIMITS.expectedAnnualReturn.max} step={0.1} value={values.expectedAnnualReturn} onValueChange={value=>update("expectedAnnualReturn",value)} error={errors.expectedAnnualReturn} required/>
      <CalculatorSelectInput id="mode" label="Withdrawal duration" value={values.withdrawalMode} onValueChange={value=>update("withdrawalMode",value)} options={[{label:"Fixed duration",value:"fixedDuration"},{label:"Until balance is exhausted",value:"untilExhausted"}]} error={errors.withdrawalMode} required/>
      {values.withdrawalMode==="fixedDuration"?<CalculatorNumberInput id="years" label="Withdrawal duration" suffix="years" min={SWP_LIMITS.durationYears.min} max={SWP_LIMITS.durationYears.max} step={1} value={values.durationYears} onValueChange={value=>update("durationYears",value)} error={errors.durationYears} required/>:null}
      <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" size="lg" className="flex-1">Calculate SWP</Button><Button type="button" size="lg" variant="outline" className="flex-1" onClick={reset}>Reset</Button></div>
    </form></CalculatorShell></div>
    <div className="space-y-6"><CalculatorResultCard title="SWP estimate" items={calculation?resultItems(calculation.result):[]} emptyTitle="Your estimate will appear here" emptyDescription="Enter the withdrawal assumptions, then calculate."/>
      {calculation?<><CalculatorActions resultText={copiedText} shareUrl={buildSWPCalculatorUrl(calculation.input,"https://thinkcalculator.in")}/><CalculationSummary title="ThinkCalculator SWP Estimate" calculationDate={calculation.date} disclaimer="Market returns are uncertain and not guaranteed. This projection excludes taxation of withdrawals and product-specific rules." items={[{label:"Initial investment",value:formatIndianCurrency(calculation.input.initialInvestment)},{label:"Monthly withdrawal",value:formatIndianCurrency(calculation.input.monthlyWithdrawal)},{label:"Expected annual return assumption",value:formatPercentage(calculation.input.expectedAnnualReturn)},{label:"Withdrawal duration",value:calculation.input.withdrawalMode==="fixedDuration"?`${calculation.input.durationYears} years, fixed`:"Until balance is exhausted"},{label:"Total withdrawn",value:formatIndianCurrency(calculation.result.totalWithdrawn)},{label:"Total growth",value:formatIndianCurrency(calculation.result.totalGrowth)},{label:"Remaining balance",value:formatIndianCurrency(calculation.result.remainingBalance)},{label:"Balance exhausted",value:calculation.result.isExhausted?`Yes, after ${formatDurationText(calculation.result.exhaustionMonth!)}`:"No"},{label:"Duration simulated",value:formatDurationText(calculation.result.monthsSimulated)}]}/></>:null}
    </div>
    {calculation?<section className="col-span-full" data-calculation-experience aria-labelledby="swp-schedule-heading"><h2 id="swp-schedule-heading" className="text-2xl font-semibold">Yearly balance schedule</h2><p className="mt-3 text-muted-foreground">Each year&apos;s withdrawals are taken before that year&apos;s growth is applied to the remaining balance. Displayed currency is rounded; calculations retain precision.</p><div className="mt-6"><DataTable caption="SWP yearly balance schedule" rows={calculation.result.schedule} columns={columns}/></div></section>:null}
  </>
}
