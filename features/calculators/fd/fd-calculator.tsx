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
import { calculateFD } from "@/features/calculators/fd/calculate-fd"
import { calculateFDSchedule } from "@/features/calculators/fd/calculate-fd-schedule"
import { calculateFDYearlySchedule, type FDYearlyScheduleRow } from "@/features/calculators/fd/calculate-fd-yearly-schedule"
import { FD_LIMITS, parseAndValidateFDForm, type FDFormValues } from "@/features/calculators/fd/fd-schema"
import { buildFDCalculatorUrl, FD_DEFAULT_INPUT, parseFDUrlState } from "@/features/calculators/fd/fd-url-state"
import type { FDCompoundingFrequency, FDDurationUnit, FDInput, FDScheduleRow, FDValidationErrors } from "@/features/calculators/fd/fd-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const FREQUENCY_LABELS: Readonly<Record<FDCompoundingFrequency, string>> = { monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", yearly: "Yearly" }
const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))

const PRINCIPAL_QUICK_AMOUNTS = [
  { label: "25K", value: "25000" },
  { label: "1L", value: "100000" },
  { label: "5L", value: "500000" },
  { label: "10L", value: "1000000" },
]

const yearlyScheduleColumns: readonly DataTableColumn<FDYearlyScheduleRow>[] = [
  { header: "Year", cell: (row) => `Year ${row.year}` },
  { header: "Yearly growth", cell: (row) => formatIndianCurrency(row.yearlyGrowth) },
  { header: "Interest earned to date", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

const detailedScheduleColumns: readonly DataTableColumn<FDScheduleRow>[] = [
  { header: "Period", cell: (row) => row.periodNumber },
  { header: "Months elapsed", cell: (row) => row.monthsElapsed },
  { header: "Interest earned", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

function toFormValues(input: FDInput): FDFormValues {
  return { principalAmount: String(input.principalAmount), annualInterestRate: String(input.annualInterestRate), duration: String(input.duration), durationUnit: input.durationUnit, compoundingFrequency: input.compoundingFrequency }
}

/** yearlyGrowth is already this year's own incremental interest. The principal is deposited once,
 * so its "invested" contribution appears only in the first row. */
function toYearlyChartData(schedule: readonly FDYearlyScheduleRow[]) {
  let previousPrincipal = 0
  const labels: string[] = []
  const invested: number[] = []
  const returns: number[] = []
  for (const row of schedule) {
    const principalToDate = row.maturityAmount - row.interestEarned
    labels.push(`Y${row.year}`)
    invested.push(Math.round(principalToDate - previousPrincipal))
    returns.push(Math.round(row.yearlyGrowth))
    previousPrincipal = principalToDate
  }
  return { labels, invested, returns }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isDurationUnit(value: string): value is FDDurationUnit {
  return value === "years" || value === "months"
}

function isCompoundingFrequency(value: string): value is FDCompoundingFrequency {
  return value === "monthly" || value === "quarterly" || value === "half-yearly" || value === "yearly"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke instead of waiting for a valid, submitted form. */
function toLiveInput(values: FDFormValues): FDInput {
  const durationUnit: FDDurationUnit = isDurationUnit(values.durationUnit) ? values.durationUnit : "years"
  const durationLimits = durationUnit === "years" ? FD_LIMITS.durationYears : FD_LIMITS.durationMonths
  const compoundingFrequency: FDCompoundingFrequency = isCompoundingFrequency(values.compoundingFrequency) ? values.compoundingFrequency : "quarterly"
  return {
    principalAmount: clampFinite(Number(values.principalAmount), FD_DEFAULT_INPUT.principalAmount, FD_LIMITS.principalAmount.min, FD_LIMITS.principalAmount.max),
    annualInterestRate: clampFinite(Number(values.annualInterestRate), FD_DEFAULT_INPUT.annualInterestRate, FD_LIMITS.annualInterestRate.min, FD_LIMITS.annualInterestRate.max),
    duration: Math.round(clampFinite(Number(values.duration), FD_DEFAULT_INPUT.duration, durationLimits.min, durationLimits.max)),
    durationUnit,
    compoundingFrequency,
  }
}

export function FDCalculator() {
  const [values, setValues] = useState<FDFormValues>(() => toFormValues(FD_DEFAULT_INPUT))
  const [errors, setErrors] = useState<FDValidationErrors>({})
  const [showDetailedSchedule, setShowDetailedSchedule] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseFDUrlState(search)))
  })

  function updateValue(field: keyof FDFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateFDForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildFDCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(FD_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/fd-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateFD(liveInput), [liveInput])
  useTrackCalculationCompleted("fd", "savings", result)
  const yearlySchedule = useMemo(() => calculateFDYearlySchedule(liveInput), [liveInput])
  const detailedSchedule = useMemo(() => calculateFDSchedule(liveInput), [liveInput])

  const durationIsYears = liveInput.durationUnit === "years"

  const yearlyChartData = useMemo(() => toYearlyChartData(yearlySchedule), [yearlySchedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Principal", values: yearlyChartData.invested, colorVar: "--money" },
    { label: "Interest", values: yearlyChartData.returns, colorVar: "--gold" },
  ], [yearlyChartData])

  const shareUrl = buildFDCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator FD Calculation", "",
    `Deposit amount: ${formatIndianCurrency(liveInput.principalAmount)}`,
    `Annual interest rate: ${formatPercentage(liveInput.annualInterestRate)}`,
    `Deposit duration: ${liveInput.duration} ${liveInput.durationUnit}`,
    `Compounding frequency: ${FREQUENCY_LABELS[liveInput.compoundingFrequency]}`,
    `Interest earned: ${formatIndianCurrency(result.interestEarned)}`,
    `Maturity amount: ${formatIndianCurrency(result.maturityAmount)}`,
    "", "Calculator:", `${siteConfig.url}/finance/fd-calculator`,
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
                    id="deposit-amount"
                    label="Deposit amount"
                    description="Enter the principal amount placed in the fixed deposit."
                    prefix="₹"
                    min={FD_LIMITS.principalAmount.min}
                    max={FD_LIMITS.principalAmount.max}
                    step={1_000}
                    value={values.principalAmount}
                    sliderValue={liveInput.principalAmount}
                    onValueChange={(value) => updateValue("principalAmount", value)}
                    error={errors.principalAmount}
                    required
                    accentClassName="accent-money"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {PRINCIPAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("principalAmount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-money hover:text-money focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="annual-interest-rate"
                  label="Annual interest rate"
                  description="Enter the annual rate offered for the deposit."
                  suffix="%"
                  min={FD_LIMITS.annualInterestRate.min}
                  max={FD_LIMITS.annualInterestRate.max}
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
                  description="Enter how long the deposit will remain invested."
                  suffix={durationIsYears ? "years" : "months"}
                  min={1}
                  max={durationIsYears ? FD_LIMITS.durationYears.max : FD_LIMITS.durationMonths.max}
                  step={1}
                  value={values.duration}
                  sliderValue={liveInput.duration}
                  onValueChange={(value) => updateValue("duration", value)}
                  error={errors.duration}
                  required
                  accentClassName="accent-money"
                />
                <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
                <CalculatorSelectInput id="compounding-frequency" label="Compounding frequency" description="Choose how often interest is added to the deposit." value={values.compoundingFrequency} onValueChange={(value) => updateValue("compoundingFrequency", value)} options={FREQUENCY_OPTIONS} error={errors.compoundingFrequency} required />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-savings-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Maturity amount</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-savings">{formatIndianCurrency(result.maturityAmount)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">over {result.totalMonths} months at {liveInput.annualInterestRate.toFixed(2)}% p.a. ({FREQUENCY_LABELS[liveInput.compoundingFrequency]} compounding)</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Principal amount</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.principalAmount)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Interest earned</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.interestEarned)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <SimpleDonutChart
                title="Principal vs interest"
                items={[
                  { label: "Principal", value: result.principalAmount, formattedValue: formatIndianCurrency(result.principalAmount), colorClass: "bg-money", ringClass: "stroke-money" },
                  { label: "Interest", value: result.interestEarned, formattedValue: formatIndianCurrency(result.interestEarned), colorClass: "bg-gold", ringClass: "stroke-gold" },
                ]}
              />
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="fd" category="savings" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="fd-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-savings uppercase">Maturity breakdown</p>
        <h2 id="fd-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Principal vs interest, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">The principal shows up once, at the start; every bar after that is interest earned that year.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartData.labels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of principal versus interest earned each year of the deposit"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Maturity schedule" description="How the deposit grows year by year under the selected compounding convention.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setShowDetailedSchedule((value) => !value)}>{showDetailedSchedule ? "View yearly summary" : "View detailed schedule"}</Button>
          </div>
          <div className="mt-4">
            {showDetailedSchedule ? (
              <DataTable caption="Detailed FD maturity schedule" rows={detailedSchedule} columns={detailedScheduleColumns} />
            ) : (
              <DataTable caption="Yearly FD maturity schedule" rows={yearlySchedule} columns={yearlyScheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
