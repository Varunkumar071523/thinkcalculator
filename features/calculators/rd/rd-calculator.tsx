"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { calculateRD } from "@/features/calculators/rd/calculate-rd"
import { calculateRDSchedule } from "@/features/calculators/rd/calculate-rd-schedule"
import { calculateRDYearlySchedule, type RDYearlyScheduleRow } from "@/features/calculators/rd/calculate-rd-yearly-schedule"
import { RD_LIMITS, parseAndValidateRDForm, type RDFormValues } from "@/features/calculators/rd/rd-schema"
import { buildRDCalculatorUrl, parseRDUrlState, RD_DEFAULT_INPUT } from "@/features/calculators/rd/rd-url-state"
import type { RDCompoundingFrequency, RDDurationUnit, RDInput, RDScheduleRow, RDValidationErrors } from "@/features/calculators/rd/rd-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const FREQUENCY_LABELS: Readonly<Record<RDCompoundingFrequency, string>> = { monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", yearly: "Yearly" }
const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))

const DEPOSIT_QUICK_AMOUNTS = [
  { label: "2K", value: "2000" },
  { label: "5K", value: "5000" },
  { label: "10K", value: "10000" },
  { label: "25K", value: "25000" },
]

const yearlyScheduleColumns: readonly DataTableColumn<RDYearlyScheduleRow>[] = [
  { header: "Year", cell: (row) => `Year ${row.year}` },
  { header: "Yearly growth", cell: (row) => formatIndianCurrency(row.yearlyGrowth) },
  { header: "Total deposited to date", cell: (row) => formatIndianCurrency(row.totalDeposited) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

const detailedScheduleColumns: readonly DataTableColumn<RDScheduleRow>[] = [
  { header: "Period", cell: (row) => row.periodNumber },
  { header: "Months elapsed", cell: (row) => row.monthsElapsed },
  { header: "Total deposited", cell: (row) => formatIndianCurrency(row.totalDeposited) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

function toFormValues(input: RDInput): RDFormValues {
  return { monthlyDeposit: String(input.monthlyDeposit), annualInterestRate: String(input.annualInterestRate), duration: String(input.duration), durationUnit: input.durationUnit, compoundingFrequency: input.compoundingFrequency }
}

/** Both totalDeposited and interestEarned are cumulative to date — derive each year's own
 * contribution so the bar chart shows what was added that year, not the running total. */
function toYearlyChartData(schedule: readonly RDYearlyScheduleRow[]) {
  let previousDeposited = 0
  let previousInterest = 0
  const labels: string[] = []
  const deposited: number[] = []
  const interest: number[] = []
  for (const row of schedule) {
    labels.push(`Y${row.year}`)
    deposited.push(Math.round(row.totalDeposited - previousDeposited))
    interest.push(Math.round(row.interestEarned - previousInterest))
    previousDeposited = row.totalDeposited
    previousInterest = row.interestEarned
  }
  return { labels, deposited, interest }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isDurationUnit(value: string): value is RDDurationUnit {
  return value === "years" || value === "months"
}

function isCompoundingFrequency(value: string): value is RDCompoundingFrequency {
  return value === "monthly" || value === "quarterly" || value === "half-yearly" || value === "yearly"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke instead of waiting for a valid, submitted form. */
function toLiveInput(values: RDFormValues): RDInput {
  const durationUnit: RDDurationUnit = isDurationUnit(values.durationUnit) ? values.durationUnit : "years"
  const compoundingFrequency: RDCompoundingFrequency = isCompoundingFrequency(values.compoundingFrequency) ? values.compoundingFrequency : "quarterly"
  return {
    monthlyDeposit: clampFinite(Number(values.monthlyDeposit), RD_DEFAULT_INPUT.monthlyDeposit, RD_LIMITS.monthlyDeposit.min, RD_LIMITS.monthlyDeposit.max),
    annualInterestRate: clampFinite(Number(values.annualInterestRate), RD_DEFAULT_INPUT.annualInterestRate, RD_LIMITS.annualInterestRate.min, RD_LIMITS.annualInterestRate.max),
    duration: Math.round(clampFinite(Number(values.duration), RD_DEFAULT_INPUT.duration, RD_LIMITS.duration.min, RD_LIMITS.duration.max)),
    durationUnit,
    compoundingFrequency,
  }
}

export function RDCalculator() {
  const [values, setValues] = useState<RDFormValues>(() => toFormValues(RD_DEFAULT_INPUT))
  const [errors, setErrors] = useState<RDValidationErrors>({})
  const [showDetailedSchedule, setShowDetailedSchedule] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseRDUrlState(search)))
  })

  function updateValue(field: keyof RDFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateRDForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildRDCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(RD_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/rd-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateRD(liveInput), [liveInput])
  useTrackCalculationCompleted("rd", "savings", result)
  const yearlySchedule = useMemo(() => calculateRDYearlySchedule(liveInput), [liveInput])
  const detailedSchedule = useMemo(() => calculateRDSchedule(liveInput), [liveInput])

  const durationIsYears = liveInput.durationUnit === "years"

  const yearlyChartData = useMemo(() => toYearlyChartData(yearlySchedule), [yearlySchedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Deposited", values: yearlyChartData.deposited, colorVar: "--money" },
    { label: "Interest", values: yearlyChartData.interest, colorVar: "--gold" },
  ], [yearlyChartData])

  const shareUrl = buildRDCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator RD Calculation", "",
    `Monthly deposit: ${formatIndianCurrency(liveInput.monthlyDeposit)}`,
    `Annual interest rate: ${formatPercentage(liveInput.annualInterestRate)}`,
    `Deposit duration: ${liveInput.duration} ${liveInput.durationUnit}`,
    `Compounding frequency: ${FREQUENCY_LABELS[liveInput.compoundingFrequency]}`,
    `Total deposited: ${formatIndianCurrency(result.totalDeposited)}`,
    `Interest earned: ${formatIndianCurrency(result.interestEarned)}`,
    `Maturity amount: ${formatIndianCurrency(result.maturityAmount)}`,
    "", "Calculator:", `${siteConfig.url}/finance/rd-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Deposit details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="monthly-deposit"
                    label="Monthly deposit"
                    description="Enter the amount deposited at the beginning of each month."
                    prefix="₹"
                    min={RD_LIMITS.monthlyDeposit.min}
                    max={RD_LIMITS.monthlyDeposit.max}
                    step={100}
                    value={values.monthlyDeposit}
                    sliderValue={liveInput.monthlyDeposit}
                    onValueChange={(value) => updateValue("monthlyDeposit", value)}
                    error={errors.monthlyDeposit}
                    required
                    accentClassName="accent-money"
                    helperTextVariant="tooltip"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {DEPOSIT_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("monthlyDeposit", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-money hover:text-cat-savings focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="annual-interest-rate"
                  label="Annual interest rate"
                  suffix="%"
                  min={RD_LIMITS.annualInterestRate.min}
                  max={RD_LIMITS.annualInterestRate.max}
                  step={0.01}
                  sliderMin={1}
                  sliderMax={20}
                  value={values.annualInterestRate}
                  sliderValue={liveInput.annualInterestRate}
                  onValueChange={(value) => updateValue("annualInterestRate", value)}
                  error={errors.annualInterestRate}
                  required
                  accentClassName="accent-money"
                />

                <PairedNumberSliderInput
                  id="deposit-duration"
                  label="Deposit duration"
                  suffix={durationIsYears ? "years" : "months"}
                  min={RD_LIMITS.duration.min}
                  max={RD_LIMITS.duration.max}
                  step={1}
                  value={values.duration}
                  sliderValue={liveInput.duration}
                  onValueChange={(value) => updateValue("duration", value)}
                  error={errors.duration}
                  required
                  accentClassName="accent-money"
                />
                <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
                <CalculatorSelectInput id="compounding-frequency" label="Compounding frequency" value={values.compoundingFrequency} onValueChange={(value) => updateValue("compoundingFrequency", value)} options={FREQUENCY_OPTIONS} error={errors.compoundingFrequency} required />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-savings-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Maturity amount over {result.totalMonths} months at {liveInput.annualInterestRate.toFixed(2)}% p.a.</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-savings">{formatIndianCurrency(result.maturityAmount)}</p>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <SimpleDonutChart
                  title="Deposited vs interest"
                  items={[
                    { label: "Deposited", value: result.totalDeposited, formattedValue: formatIndianCurrency(result.totalDeposited), colorClass: "bg-money", ringClass: "stroke-money" },
                    { label: "Interest", value: result.interestEarned, formattedValue: formatIndianCurrency(result.interestEarned), colorClass: "bg-gold", ringClass: "stroke-gold" },
                  ]}
                  showInlineLabels
                />
                <dl className="flex shrink-0 flex-row gap-6 sm:flex-col sm:gap-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Total deposited</dt>
                    <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalDeposited)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Interest earned</dt>
                    <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.interestEarned)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="rd" category="savings" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="rd-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-savings uppercase">Maturity breakdown</p>
        <h2 id="rd-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Deposited vs interest, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s contribution, split by what was deposited vs. interest earned that year.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartData.labels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of amount deposited versus interest earned each year of the recurring deposit"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Maturity schedule" description="How cumulative deposits and interest grow year by year under the selected compounding convention.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setShowDetailedSchedule((value) => !value)}>{showDetailedSchedule ? "View yearly summary" : "View detailed schedule"}</Button>
          </div>
          <div className="mt-4">
            {showDetailedSchedule ? (
              <DataTable caption="Detailed RD maturity schedule" rows={detailedSchedule} columns={detailedScheduleColumns} />
            ) : (
              <DataTable caption="Yearly RD maturity schedule" rows={yearlySchedule} columns={yearlyScheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
