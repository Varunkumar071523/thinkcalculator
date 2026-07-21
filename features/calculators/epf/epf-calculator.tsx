"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateEPF } from "./calculate-epf"
import { createEPFResultText } from "./epf-content"
import { toLiveInput } from "./epf-live-input"
import { EPF_LIMITS, parseAndValidateEPFForm, type EPFFormValues } from "./epf-schema"
import type { EPFInput, EPFScheduleRow, EPFValidationErrors } from "./epf-types"
import { buildEPFCalculatorUrl, EPF_DEFAULT_INPUT, parseEPFUrlState } from "./epf-url-state"

function toFormValues(input: EPFInput): EPFFormValues {
  return {
    monthlyBasicSalary: String(input.monthlyBasicSalary),
    employeeContributionPercent: String(input.employeeContributionPercent),
    employerContributionPercent: String(input.employerContributionPercent),
    currentAge: String(input.currentAge),
    retirementAge: String(input.retirementAge),
    expectedAnnualInterestRate: String(input.expectedAnnualInterestRate),
  }
}

const scheduleColumns: readonly DataTableColumn<EPFScheduleRow>[] = [
  { header: "Year", cell: (row) => row.year },
  { header: "Age", cell: (row) => row.age },
  { header: "Employee contribution", cell: (row) => formatIndianCurrency(row.employeeContribution) },
  { header: "Employer contribution", cell: (row) => formatIndianCurrency(row.employerContribution) },
  { header: "Interest earned", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Closing balance", cell: (row) => formatIndianCurrency(row.closingBalance) },
]

export function EPFCalculator() {
  const [values, setValues] = useState<EPFFormValues>(() => toFormValues(EPF_DEFAULT_INPUT))
  const [errors, setErrors] = useState<EPFValidationErrors>({})

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseEPFUrlState(search)))
  })

  function updateValue(field: keyof EPFFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateEPFForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildEPFCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(EPF_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/epf-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateEPF(liveInput), [liveInput])
  const yearsToRetirement = liveInput.retirementAge - liveInput.currentAge

  const yearlyChartLabels = useMemo(() => result.schedule.map((row) => `Age ${row.age}`), [result.schedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Employee contribution", values: result.schedule.map((row) => Math.round(row.employeeContribution)), colorVar: "--money" },
    { label: "Employer contribution", values: result.schedule.map((row) => Math.round(row.employerContribution)), colorVar: "--cat-loans" },
    { label: "Interest", values: result.schedule.map((row) => Math.round(row.interestEarned)), colorVar: "--gold" },
  ], [result.schedule])

  const shareUrl = buildEPFCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createEPFResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">EPF details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <PairedNumberSliderInput
                  id="monthly-basic-salary"
                  label="Monthly basic salary (+DA)"
                  description="Basic pay plus dearness allowance, not gross salary."
                  prefix="₹"
                  min={EPF_LIMITS.monthlyBasicSalary.min}
                  max={EPF_LIMITS.monthlyBasicSalary.max}
                  step={500}
                  sliderMin={0}
                  sliderMax={300_000}
                  value={values.monthlyBasicSalary}
                  sliderValue={liveInput.monthlyBasicSalary}
                  onValueChange={(value) => updateValue("monthlyBasicSalary", value)}
                  error={errors.monthlyBasicSalary}
                  required
                  accentClassName="accent-money"
                />

                <PairedNumberSliderInput
                  id="employee-contribution-percent"
                  label="Employee contribution rate"
                  description="Statutory default is 12%; edit to model a voluntary provident fund (VPF) top-up."
                  suffix="%"
                  min={EPF_LIMITS.employeeContributionPercent.min}
                  max={EPF_LIMITS.employeeContributionPercent.max}
                  step={0.5}
                  sliderMin={0}
                  sliderMax={20}
                  value={values.employeeContributionPercent}
                  sliderValue={liveInput.employeeContributionPercent}
                  onValueChange={(value) => updateValue("employeeContributionPercent", value)}
                  error={errors.employeeContributionPercent}
                  required
                  accentClassName="accent-money"
                />

                <PairedNumberSliderInput
                  id="employer-contribution-percent"
                  label="Employer contribution rate"
                  description="Statutory default is 12% (part is normally diverted to EPS; not modelled here)."
                  suffix="%"
                  min={EPF_LIMITS.employerContributionPercent.min}
                  max={EPF_LIMITS.employerContributionPercent.max}
                  step={0.5}
                  sliderMin={0}
                  sliderMax={20}
                  value={values.employerContributionPercent}
                  sliderValue={liveInput.employerContributionPercent}
                  onValueChange={(value) => updateValue("employerContributionPercent", value)}
                  error={errors.employerContributionPercent}
                  required
                  accentClassName="accent-cat-loans"
                />

                <PairedNumberSliderInput
                  id="current-age"
                  label="Current age"
                  suffix="years"
                  min={EPF_LIMITS.currentAge.min}
                  max={EPF_LIMITS.currentAge.max}
                  step={1}
                  value={values.currentAge}
                  sliderValue={liveInput.currentAge}
                  onValueChange={(value) => updateValue("currentAge", value)}
                  error={errors.currentAge}
                  required
                  accentClassName="accent-money"
                />

                <PairedNumberSliderInput
                  id="retirement-age"
                  label="Retirement age"
                  suffix="years"
                  min={EPF_LIMITS.retirementAge.min}
                  max={EPF_LIMITS.retirementAge.max}
                  step={1}
                  value={values.retirementAge}
                  sliderValue={liveInput.retirementAge}
                  onValueChange={(value) => updateValue("retirementAge", value)}
                  error={errors.retirementAge}
                  required
                  accentClassName="accent-money"
                />

                <PairedNumberSliderInput
                  id="expected-annual-interest-rate"
                  label="Expected annual interest rate"
                  description="A constant modelling assumption for this projection, not a forecast or guaranteed rate."
                  suffix="%"
                  min={EPF_LIMITS.expectedAnnualInterestRate.min}
                  max={EPF_LIMITS.expectedAnnualInterestRate.max}
                  step={0.05}
                  sliderMin={0}
                  sliderMax={12}
                  value={values.expectedAnnualInterestRate}
                  sliderValue={liveInput.expectedAnnualInterestRate}
                  onValueChange={(value) => updateValue("expectedAnnualInterestRate", value)}
                  error={errors.expectedAnnualInterestRate}
                  required
                  accentClassName="accent-gold"
                />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-money-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated corpus at retirement</p>
              <p className="font-mono text-[42px] leading-none font-bold text-money">{formatIndianCurrency(result.maturityValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">over {yearsToRetirement} years at {liveInput.expectedAnnualInterestRate.toFixed(2)}% p.a.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total employee contribution</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalEmployeeContribution)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total employer contribution</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalEmployerContribution)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated interest</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalInterest)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Monthly contribution (both)</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.monthlyEmployeeContribution + result.monthlyEmployerContribution)}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="epf-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Corpus breakdown</p>
        <h2 id="epf-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Employee, employer, and interest, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s corpus growth, split by employee contribution, employer contribution, and interest earned that year. Illustrative only, not an official EPFO statement.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartLabels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of employee contribution, employer contribution, and interest earned each year of the EPF projection"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Yearly EPF accumulation schedule" description="Employee contribution, employer contribution, and interest, year by year. This schedule is illustrative, not an official EPFO statement.">
          <DataTable caption="Yearly EPF accumulation schedule" rows={result.schedule} columns={scheduleColumns} initialRows={15} />
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded for presentation; the calculation retains full numeric precision between years. Excludes the EPS carve-out, EPF wage ceiling, and other statutory rules — see the assumptions above.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
