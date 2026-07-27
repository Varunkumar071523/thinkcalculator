"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { GrowthLineChart, MilestoneRow, pickMilestoneIndices, type MilestoneItem } from "@/components/calculators/growth-area-chart"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { calculateLumpsum } from "@/features/calculators/lumpsum/calculate-lumpsum"
import { calculateLumpsumSchedule } from "@/features/calculators/lumpsum/calculate-lumpsum-schedule"
import { LUMPSUM_LIMITS, parseAndValidateLumpsumForm, type LumpsumFormValues } from "@/features/calculators/lumpsum/lumpsum-schema"
import { buildLumpsumCalculatorUrl, LUMPSUM_DEFAULT_INPUT, parseLumpsumUrlState } from "@/features/calculators/lumpsum/lumpsum-url-state"
import type { LumpsumDurationUnit, LumpsumInput, LumpsumScheduleRow, LumpsumValidationErrors } from "@/features/calculators/lumpsum/lumpsum-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const PRINCIPAL_QUICK_AMOUNTS = [
  { label: "25K", value: "25000" },
  { label: "1L", value: "100000" },
  { label: "5L", value: "500000" },
  { label: "10L", value: "1000000" },
]

const scheduleColumns: readonly DataTableColumn<LumpsumScheduleRow>[] = [
  { header: "Period", cell: (row) => row.periodNumber },
  { header: "Months elapsed", cell: (row) => row.monthsElapsed },
  { header: "Initial investment", cell: (row) => formatIndianCurrency(row.initialInvestment) },
  { header: "Estimated returns", cell: (row) => formatIndianCurrency(row.estimatedReturns) },
  { header: "Future value", cell: (row) => formatIndianCurrency(row.futureValue) },
]

function toFormValues(input: LumpsumInput): LumpsumFormValues {
  return { initialInvestment: String(input.initialInvestment), annualReturnRate: String(input.annualReturnRate), duration: String(input.duration), durationUnit: input.durationUnit }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isDurationUnit(value: string): value is LumpsumDurationUnit {
  return value === "years" || value === "months"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: LumpsumFormValues): LumpsumInput {
  const durationUnit: LumpsumDurationUnit = isDurationUnit(values.durationUnit) ? values.durationUnit : "years"
  const durationLimits = durationUnit === "years" ? LUMPSUM_LIMITS.durationYears : LUMPSUM_LIMITS.durationMonths
  return {
    initialInvestment: clampFinite(Number(values.initialInvestment), LUMPSUM_DEFAULT_INPUT.initialInvestment, LUMPSUM_LIMITS.initialInvestment.min, LUMPSUM_LIMITS.initialInvestment.max),
    annualReturnRate: clampFinite(Number(values.annualReturnRate), LUMPSUM_DEFAULT_INPUT.annualReturnRate, LUMPSUM_LIMITS.annualReturnRate.min, LUMPSUM_LIMITS.annualReturnRate.max),
    duration: Math.round(clampFinite(Number(values.duration), LUMPSUM_DEFAULT_INPUT.duration, durationLimits.min, durationLimits.max)),
    durationUnit,
  }
}

function formatPeriodLabel(monthsElapsed: number): string {
  return monthsElapsed % 12 === 0 ? `Year ${monthsElapsed / 12}` : `Month ${monthsElapsed}`
}

function toGrowthPoints(schedule: readonly LumpsumScheduleRow[]) {
  return schedule.map((row) => ({
    label: row.monthsElapsed % 12 === 0 ? `Yr ${row.monthsElapsed / 12}` : `${row.monthsElapsed}mo`,
    invested: row.initialInvestment,
    value: row.futureValue,
  }))
}

function toMilestoneItems(schedule: readonly LumpsumScheduleRow[], totalGain: number): readonly MilestoneItem[] {
  const indices = pickMilestoneIndices(schedule.length)
  return [
    ...indices.map((index) => ({ label: formatPeriodLabel(schedule[index].monthsElapsed), value: formatIndianCurrency(schedule[index].futureValue) })),
    { label: "Total gain", value: formatIndianCurrency(totalGain), highlight: true },
  ]
}

/** The initial investment is only "contributed" once, so its per-period delta is nonzero only in
 * the first bar — every later bar shows pure compounding growth on top of that principal. */
function toYearlyChartData(schedule: readonly LumpsumScheduleRow[]) {
  let previousInvested = 0
  let previousReturns = 0
  const labels: string[] = []
  const invested: number[] = []
  const returns: number[] = []
  for (const row of schedule) {
    labels.push(formatPeriodLabel(row.monthsElapsed).replace("Year ", "Y").replace("Month ", "M"))
    invested.push(Math.round(row.initialInvestment - previousInvested))
    returns.push(Math.round(row.estimatedReturns - previousReturns))
    previousInvested = row.initialInvestment
    previousReturns = row.estimatedReturns
  }
  return { labels, invested, returns }
}

export function LumpsumCalculator() {
  const [values, setValues] = useState<LumpsumFormValues>(() => toFormValues(LUMPSUM_DEFAULT_INPUT))
  const [errors, setErrors] = useState<LumpsumValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseLumpsumUrlState(search)))
  })

  function updateValue(field: keyof LumpsumFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateLumpsumForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildLumpsumCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(LUMPSUM_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/lumpsum-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateLumpsum(liveInput), [liveInput])
  useTrackCalculationCompleted("lumpsum", "investments", result)
  const schedule = useMemo(() => calculateLumpsumSchedule(liveInput), [liveInput])
  const growthPoints = useMemo(() => toGrowthPoints(schedule), [schedule])
  const milestoneItems = useMemo(() => toMilestoneItems(schedule, result.estimatedReturns), [schedule, result.estimatedReturns])
  const durationIsYears = liveInput.durationUnit === "years"

  const yearlyChartData = useMemo(() => toYearlyChartData(schedule), [schedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Invested", values: yearlyChartData.invested, colorVar: "--cat-invest" },
    { label: "Returns", values: yearlyChartData.returns, colorVar: "--gold" },
  ], [yearlyChartData])

  const shareUrl = buildLumpsumCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator Lumpsum Calculation", "",
    `Initial investment: ${formatIndianCurrency(liveInput.initialInvestment)}`,
    `Expected annual return: ${formatPercentage(liveInput.annualReturnRate)}`,
    `Investment duration: ${liveInput.duration} ${liveInput.durationUnit}`,
    `Estimated returns: ${formatIndianCurrency(result.estimatedReturns)}`,
    `Estimated future value: ${formatIndianCurrency(result.futureValue)}`,
    "", "Calculator:", `${siteConfig.url}/finance/lumpsum-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Lumpsum details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="initial-investment"
                    label="Initial investment"
                    description="Enter the one-time amount you plan to invest."
                    prefix="₹"
                    min={LUMPSUM_LIMITS.initialInvestment.min}
                    max={LUMPSUM_LIMITS.initialInvestment.max}
                    step={1_000}
                    value={values.initialInvestment}
                    sliderValue={liveInput.initialInvestment}
                    onValueChange={(value) => updateValue("initialInvestment", value)}
                    error={errors.initialInvestment}
                    required
                    accentClassName="accent-cat-invest"
                    helperTextVariant="tooltip"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {PRINCIPAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("initialInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="annual-return-rate"
                  label="Expected annual return"
                  description="Enter the return you expect the investment to earn each year."
                  suffix="%"
                  min={LUMPSUM_LIMITS.annualReturnRate.min}
                  max={LUMPSUM_LIMITS.annualReturnRate.max}
                  step={0.1}
                  sliderMin={1}
                  sliderMax={20}
                  value={values.annualReturnRate}
                  sliderValue={liveInput.annualReturnRate}
                  onValueChange={(value) => updateValue("annualReturnRate", value)}
                  error={errors.annualReturnRate}
                  required
                  accentClassName="accent-cat-invest"
                  helperTextVariant="tooltip"
                />

                <PairedNumberSliderInput
                  id="investment-duration"
                  label="Investment duration"
                  description="Enter how long the investment will stay invested."
                  suffix={durationIsYears ? "years" : "months"}
                  min={1}
                  max={durationIsYears ? LUMPSUM_LIMITS.durationYears.max : LUMPSUM_LIMITS.durationMonths.max}
                  step={1}
                  sliderMin={durationIsYears ? LUMPSUM_LIMITS.durationYears.min : LUMPSUM_LIMITS.durationMonths.min}
                  sliderMax={durationIsYears ? LUMPSUM_LIMITS.durationYears.max : LUMPSUM_LIMITS.durationMonths.max}
                  value={values.duration}
                  sliderValue={liveInput.duration}
                  onValueChange={(value) => updateValue("duration", value)}
                  error={errors.duration}
                  required
                  accentClassName="accent-cat-invest"
                  helperTextVariant="tooltip"
                />
                <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated future value over {liveInput.duration} {liveInput.durationUnit} at {liveInput.annualReturnRate.toFixed(2)}% p.a.</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(result.futureValue)}</p>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <SimpleDonutChart
                  title="Invested vs returns"
                  items={[
                    { label: "Invested", value: result.initialInvestment, formattedValue: formatIndianCurrency(result.initialInvestment), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
                    { label: "Returns", value: result.estimatedReturns, formattedValue: formatIndianCurrency(result.estimatedReturns), colorClass: "bg-gold", ringClass: "stroke-gold" },
                  ]}
                  showInlineLabels
                />
                <dl className="flex shrink-0 flex-row gap-6 sm:flex-col sm:gap-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Initial investment</dt>
                    <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.initialInvestment)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Estimated returns</dt>
                    <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.estimatedReturns)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="lumpsum" category="investments" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="lumpsum-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Growth breakdown</p>
        <h2 id="lumpsum-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Invested vs returns, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one period&apos;s contribution to the total. The principal shows up once, at the start; every bar after that is compounding growth.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartData.labels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of the initial investment versus estimated returns for each period"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Growth schedule" description="Initial investment vs. estimated total value, year by year. Returns are estimates, not guaranteed.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
          </div>
          <div className="mt-4">
            {scheduleView === "chart" ? (
              <>
                <GrowthLineChart points={growthPoints} investedLabel="Initial investment" valueLabel="Total value (estimated)" />
                <MilestoneRow items={milestoneItems} />
              </>
            ) : (
              <DataTable caption="Lumpsum growth schedule" rows={schedule} columns={scheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
