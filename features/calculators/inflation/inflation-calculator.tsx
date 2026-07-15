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
import { calculateInflation } from "./calculate-inflation"
import { INFLATION_LIMITS,parseAndValidateInflationForm,type InflationFormValues } from "./inflation-schema"
import type { InflationInput,InflationResult,InflationScheduleRow,InflationValidationErrors } from "./inflation-types"
import { buildInflationCalculatorUrl,INFLATION_DEFAULT_INPUT,parseInflationUrlState,parseValidInflationUrlState } from "./inflation-url-state"

const toForm=(input:InflationInput):InflationFormValues=>({mode:input.mode,amount:String(input.amount),annualInflationRate:String(input.annualInflationRate),years:String(input.years)})
const resultItems=(result:InflationResult):readonly CalculatorResultItem[]=>result.mode==="futureCost"
  ?[{id:"future-value",label:"Equivalent future cost",value:result.futureValue,displayType:"currency",isPrimary:true},{id:"current-amount",label:"Current amount",value:result.currentAmount,displayType:"currency"},{id:"impact",label:"Total inflation impact",value:result.totalInflationImpact,displayType:"currency"},{id:"multiple",label:"Inflation multiple",value:`${result.inflationMultiple.toFixed(4)}×`,displayType:"text"}]
  :[{id:"present-value",label:"Present value (today's purchasing power)",value:result.presentValue,displayType:"currency",isPrimary:true},{id:"future-amount",label:"Future amount",value:result.futureAmount,displayType:"currency"},{id:"change",label:"Purchasing power change",value:result.purchasingPowerChange,displayType:"currency"},{id:"change-percentage",label:"Purchasing power change (%)",value:result.purchasingPowerChangePercentage,displayType:"percentage"}]
const columns:readonly DataTableColumn<InflationScheduleRow>[]=[{header:"Year",cell:row=>row.year},{header:"Cumulative factor",cell:row=>`${row.cumulativeFactor.toFixed(4)}×`},{header:"Equivalent value",cell:row=>formatIndianCurrency(row.equivalentValue)}]

export function InflationCalculator(){
  const[values,setValues]=useState(()=>toForm(INFLATION_DEFAULT_INPUT))
  const[errors,setErrors]=useState<InflationValidationErrors>({})
  const[calculation,setCalculation]=useState<{input:InflationInput;result:InflationResult;date:string}|null>(null)
  useEffect(()=>{const timer=setTimeout(()=>{const search=new URLSearchParams(location.search),input=parseInflationUrlState(search),shared=parseValidInflationUrlState(search);setValues(toForm(input));if(shared)setCalculation({input:shared,result:calculateInflation(shared),date:new Intl.DateTimeFormat("en-IN",{dateStyle:"long"}).format(new Date())})},0);return()=>clearTimeout(timer)},[])
  function update(field:keyof InflationFormValues,value:string){
    // Switching modes does NOT reset the amount field: the same numeric value is a valid "amount of
    // money" under either interpretation (a current amount or a future amount), unlike Step-up SIP's
    // mode toggle where the field's meaning and bounds genuinely differ enough to warrant a reset.
    setValues(current=>({...current,[field]:value}))
    setErrors(current=>({...current,[field]:undefined}))
    setCalculation(null)
  }
  function submit(event:FormEvent){event.preventDefault();const validation=parseAndValidateInflationForm(values);if(!validation.success){setErrors(validation.errors);setCalculation(null);return}const result=calculateInflation(validation.data);setErrors({});setCalculation({input:validation.data,result,date:new Intl.DateTimeFormat("en-IN",{dateStyle:"long"}).format(new Date())});history.replaceState(null,"",buildInflationCalculatorUrl(validation.data))}
  function reset(){setValues(toForm(INFLATION_DEFAULT_INPUT));setErrors({});setCalculation(null);history.replaceState(null,"","/finance/inflation-calculator")}
  const amountLabel=values.mode==="futureCost"?"Current amount":"Future amount"
  const copiedText=calculation?["ThinkCalculator Inflation Estimate",`Mode: ${calculation.input.mode==="futureCost"?"Future cost":"Present value / purchasing power"}`,`${calculation.input.mode==="futureCost"?"Current amount":"Future amount"}: ${formatIndianCurrency(calculation.input.amount)}`,`Assumed annual inflation rate: ${formatPercentage(calculation.input.annualInflationRate)}`,`Duration: ${calculation.input.years} years`,calculation.result.mode==="futureCost"?`Equivalent future cost: ${formatIndianCurrency(calculation.result.futureValue)}`:`Present value: ${formatIndianCurrency(calculation.result.presentValue)}`,calculation.result.mode==="futureCost"?`Total inflation impact: ${formatIndianCurrency(calculation.result.totalInflationImpact)}`:`Purchasing power change: ${formatIndianCurrency(calculation.result.purchasingPowerChange)} (${formatPercentage(calculation.result.purchasingPowerChangePercentage)})`,"This is an illustrative assumption, not an economic forecast or CPI-linked data. It excludes Cost Inflation Index and other tax-indexation rules."].join("\n"):""
  return <>
    <div data-calculator-form><CalculatorShell title="Estimate inflation impact" description="Project a current amount forward, or see what a future amount is worth in today's purchasing power."><form className="space-y-5" onSubmit={submit} noValidate>
      <CalculatorSelectInput id="mode" label="Calculation mode" value={values.mode} onValueChange={value=>update("mode",value)} options={[{label:"Future cost",value:"futureCost"},{label:"Present value / purchasing power",value:"presentValue"}]} error={errors.mode} required/>
      <CalculatorNumberInput id="amount" label={amountLabel} prefix="₹" min={INFLATION_LIMITS.amount.min} max={INFLATION_LIMITS.amount.max} step={1_000} value={values.amount} onValueChange={value=>update("amount",value)} error={errors.amount} required/>
      <CalculatorNumberInput id="rate" label="Assumed annual inflation rate" description="A negative value models deflation. This is a modelling assumption, not official CPI data." suffix="%" min={INFLATION_LIMITS.annualInflationRate.min} max={INFLATION_LIMITS.annualInflationRate.max} step={0.1} value={values.annualInflationRate} onValueChange={value=>update("annualInflationRate",value)} error={errors.annualInflationRate} required/>
      <CalculatorNumberInput id="years" label="Duration" suffix="years" min={INFLATION_LIMITS.years.min} max={INFLATION_LIMITS.years.max} step={1} value={values.years} onValueChange={value=>update("years",value)} error={errors.years} required/>
      <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" size="lg" className="flex-1">Calculate inflation impact</Button><Button type="button" size="lg" variant="outline" className="flex-1" onClick={reset}>Reset</Button></div>
    </form></CalculatorShell></div>
    <div className="space-y-6"><CalculatorResultCard title="Inflation estimate" items={calculation?resultItems(calculation.result):[]} emptyTitle="Your estimate will appear here" emptyDescription="Enter the amount and rate assumptions, then calculate."/>
      {calculation?<><CalculatorActions resultText={copiedText} shareUrl={buildInflationCalculatorUrl(calculation.input,"https://thinkcalculator.in")}/><CalculationSummary title="ThinkCalculator Inflation Estimate" calculationDate={calculation.date} disclaimer="This is an illustrative assumption, not an economic forecast or CPI-linked data. It excludes Cost Inflation Index and other tax-indexation rules." items={[{label:"Mode",value:calculation.input.mode==="futureCost"?"Future cost":"Present value / purchasing power"},{label:calculation.input.mode==="futureCost"?"Current amount":"Future amount",value:formatIndianCurrency(calculation.input.amount)},{label:"Assumed annual inflation rate",value:formatPercentage(calculation.input.annualInflationRate)},{label:"Duration",value:`${calculation.input.years} years`},...(calculation.result.mode==="futureCost"?[{label:"Equivalent future cost",value:formatIndianCurrency(calculation.result.futureValue)},{label:"Total inflation impact",value:formatIndianCurrency(calculation.result.totalInflationImpact)}]:[{label:"Present value",value:formatIndianCurrency(calculation.result.presentValue)},{label:"Purchasing power change",value:`${formatIndianCurrency(calculation.result.purchasingPowerChange)} (${formatPercentage(calculation.result.purchasingPowerChangePercentage)})`}])]}/></>:null}
    </div>
    {calculation?<section className="col-span-full" data-calculation-experience aria-labelledby="inflation-schedule-heading"><h2 id="inflation-schedule-heading" className="text-2xl font-semibold">Year-by-year schedule</h2><p className="mt-3 text-muted-foreground">{calculation.input.mode==="futureCost"?"Each row shows the equivalent cost if the same amount were needed in that year instead of today.":"Each row shows what the future amount would be worth in today's purchasing power if received in that year instead."} Displayed currency is rounded; calculations retain precision.</p><div className="mt-6"><DataTable caption={calculation.input.mode==="futureCost"?"Inflation future cost schedule":"Inflation present value schedule"} rows={calculation.result.schedule} columns={columns}/></div></section>:null}
  </>
}
