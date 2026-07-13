"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalculatorResultCard, CalculatorShell } from "@/features/calculators/core"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { CalculatorResultItem } from "@/types/calculator"
import { calculatePPF } from "./calculate-ppf"
import { createPPFPrintDisclaimer, createPPFResultText } from "./ppf-content"
import { PPF_RATE_CONFIG } from "./ppf-rate-config"
import { parseAndValidatePPFForm, PPF_LIMITS, type PPFFormValues } from "./ppf-schema"
import { PPF_DURATIONS, type PPFInput, type PPFResult, type PPFScheduleRow, type PPFValidationErrors } from "./ppf-types"
import { buildPPFCalculatorUrl, parsePPFUrlState, parseValidPPFUrlState, PPF_DEFAULT_INPUT } from "./ppf-url-state"

const durationOptions = PPF_DURATIONS.map((years) => ({ label: `${years} years`, value: String(years) }))
const columns: readonly DataTableColumn<PPFScheduleRow>[] = [
  { header: "Year", cell: (row) => row.year }, { header: "Opening balance", cell: (row) => formatIndianCurrency(row.openingBalance) },
  { header: "Contribution", cell: (row) => formatIndianCurrency(row.contribution) }, { header: "Interest earned", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Closing balance", cell: (row) => formatIndianCurrency(row.closingBalance) },
]
const toForm = (input: PPFInput): PPFFormValues => ({ annualContribution: String(input.annualContribution), assumedAnnualInterestRate: String(input.assumedAnnualInterestRate), durationYears: String(input.durationYears) })
const resultItems = (result: PPFResult): readonly CalculatorResultItem[] => [
  { id: "maturity", label: "Estimated maturity value", value: result.maturityValue, displayType: "currency", isPrimary: true },
  { id: "contributions", label: "Total contributions", value: result.totalContributions, displayType: "currency" },
  { id: "interest", label: "Estimated interest", value: result.totalInterest, displayType: "currency" },
]

export function PPFCalculator() {
  const [values, setValues] = useState(() => toForm(PPF_DEFAULT_INPUT))
  const [errors, setErrors] = useState<PPFValidationErrors>({})
  const [calculation, setCalculation] = useState<{ input: PPFInput; result: PPFResult; date: string } | null>(null)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = new URLSearchParams(window.location.search)
      const parsed = parsePPFUrlState(search)
      const shared = parseValidPPFUrlState(search)
      setValues(toForm(parsed))
      if (shared) setCalculation({ input: shared, result: calculatePPF(shared), date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])
  function update(field: keyof PPFFormValues, value: string) { setValues((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: undefined })) }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const validation = parseAndValidatePPFForm(values)
    if (!validation.success) { setErrors(validation.errors); setCalculation(null); return }
    setErrors({}); setCalculation({ input: validation.data, result: calculatePPF(validation.data), date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) }); window.history.replaceState(null, "", buildPPFCalculatorUrl(validation.data))
  }
  function reset() { setValues(toForm(PPF_DEFAULT_INPUT)); setErrors({}); setCalculation(null); window.history.replaceState(null, "", "/finance/ppf-calculator") }
  const shareUrl = calculation ? buildPPFCalculatorUrl(calculation.input, "https://thinkcalculator.in") : ""
  const resultText = calculation ? createPPFResultText(calculation.input, calculation.result) : ""
  return <>
    <div data-calculator-form><CalculatorShell title="Estimate PPF maturity" description="Build an annual PPF projection with an editable constant rate and visible timing assumptions."><form className="space-y-5" onSubmit={submit} noValidate>
      <CalculatorNumberInput id="annual-contribution" label="Annual contribution" description="₹500 to ₹1,50,000, in whole-rupee multiples of ₹50." prefix="₹" min={PPF_LIMITS.annualContribution.min} max={PPF_LIMITS.annualContribution.max} step={PPF_LIMITS.annualContribution.step} value={values.annualContribution} onValueChange={(value) => update("annualContribution", value)} error={errors.annualContribution} required />
      <CalculatorNumberInput id="assumed-annual-rate" label="Assumed annual interest rate" description={`${PPF_RATE_CONFIG.defaultRate}% reference default: ${PPF_RATE_CONFIG.verifiedPeriod}. Checked ${PPF_RATE_CONFIG.checkedOn}; not a current-rate claim.`} suffix="%" min={PPF_LIMITS.assumedAnnualInterestRate.min} max={PPF_LIMITS.assumedAnnualInterestRate.max} step={0.01} value={values.assumedAnnualInterestRate} onValueChange={(value) => update("assumedAnnualInterestRate", value)} error={errors.assumedAnnualInterestRate} required />
      <CalculatorSelectInput id="duration" label="Projection duration" description="The selector counts projection years. Official maturity timing, extension eligibility, and applications are outside this calculator." value={values.durationYears} onValueChange={(value) => update("durationYears", value)} options={durationOptions} error={errors.durationYears} required />
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6"><strong>Projection assumptions:</strong> the entered rate stays constant, and each annual contribution is added at the beginning of the projection year. Actual PPF rates may change, and official interest eligibility is determined monthly.</div>
      <div className="flex flex-col gap-3 sm:flex-row"><Button className="flex-1" size="lg" type="submit">Calculate PPF</Button><Button className="flex-1" size="lg" variant="outline" type="button" onClick={reset}>Reset</Button></div>
    </form></CalculatorShell></div>
    <div className="space-y-6"><CalculatorResultCard title="PPF projection" items={calculation ? resultItems(calculation.result) : []} emptyTitle="Your PPF projection will appear here" emptyDescription="Enter the annual contribution, assumed rate, and duration, then select Calculate PPF." />
      {calculation ? <><CalculatorActions resultText={resultText} shareUrl={shareUrl} /><Card><CardContent><SimpleDonutChart title="Contributions versus estimated interest" items={[{ label: "Total contributions", value: calculation.result.totalContributions, formattedValue: formatIndianCurrency(calculation.result.totalContributions), colorClass: "bg-chart-1" }, { label: "Estimated interest", value: calculation.result.totalInterest, formattedValue: formatIndianCurrency(calculation.result.totalInterest), colorClass: "bg-chart-2" }]} /></CardContent></Card>
      <CalculationSummary title="ThinkCalculator PPF Projection" calculationDate={calculation.date} disclaimer={createPPFPrintDisclaimer()} items={[{ label: "Annual contribution", value: formatIndianCurrency(calculation.input.annualContribution) }, { label: "Assumed constant rate", value: formatPercentage(calculation.input.assumedAnnualInterestRate) }, { label: "Projection duration", value: `${calculation.input.durationYears} years` }, { label: "Contribution timing", value: "Beginning of each projection year" }, { label: "Total contributions", value: formatIndianCurrency(calculation.result.totalContributions) }, { label: "Estimated interest", value: formatIndianCurrency(calculation.result.totalInterest) }, { label: "Estimated maturity value", value: formatIndianCurrency(calculation.result.maturityValue) }]} /></> : null}
    </div>
    {calculation ? <section className="col-span-full mt-4" data-calculation-experience aria-labelledby="ppf-schedule"><h2 id="ppf-schedule" className="text-2xl font-semibold">Annual PPF projection schedule</h2><p className="mt-3 text-muted-foreground">Contributions are modeled at the beginning of each projection year and one constant assumed rate is applied. This schedule is illustrative, not an official PPF statement.</p><div className="mt-6"><DataTable caption="Annual PPF schedule using beginning-of-year contributions and one constant assumed rate; illustrative only" rows={calculation.result.schedule} columns={columns} /></div><p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded for presentation; the calculation retains full numeric precision between years.</p></section> : null}
  </>
}
