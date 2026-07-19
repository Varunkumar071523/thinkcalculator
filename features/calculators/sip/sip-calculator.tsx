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
import { calculateSIP } from "@/features/calculators/sip/calculate-sip"
import { calculateSIPSchedule } from "@/features/calculators/sip/calculate-sip-schedule"
import { parseAndValidateSIPForm, SIP_LIMITS, type SIPFormValues } from "@/features/calculators/sip/sip-schema"
import { buildSIPCalculatorUrl, SIP_DEFAULT_INPUT, parseSIPUrlState } from "@/features/calculators/sip/sip-url-state"
import type { SIPDurationUnit, SIPInput, SIPScheduleRow, SIPValidationErrors } from "@/features/calculators/sip/sip-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const MONTHLY_QUICK_AMOUNTS = [
  { label: "2K", value: "2000" },
  { label: "5K", value: "5000" },
  { label: "10K", value: "10000" },
  { label: "25K", value: "25000" },
]

const scheduleColumns: readonly DataTableColumn<SIPScheduleRow>[] = [
  { header: "Period", cell: (row) => row.periodNumber },
  { header: "Months elapsed", cell: (row) => row.monthsElapsed },
  { header: "Invested amount", cell: (row) => formatIndianCurrency(row.investedAmount) },
  { header: "Estimated returns", cell: (row) => formatIndianCurrency(row.estimatedReturns) },
  { header: "Future value", cell: (row) => formatIndianCurrency(row.futureValue) },
]

function toFormValues(input: SIPInput): SIPFormValues {
  return { monthlyInvestment: String(input.monthlyInvestment), annualReturnRate: String(input.annualReturnRate), duration: String(input.duration), durationUnit: input.durationUnit }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isDurationUnit(value: string): value is SIPDurationUnit {
  return value === "years" || value === "months"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: SIPFormValues): SIPInput {
  const durationUnit: SIPDurationUnit = isDurationUnit(values.durationUnit) ? values.durationUnit : "years"
  const durationLimits = durationUnit === "years" ? SIP_LIMITS.durationYears : SIP_LIMITS.durationMonths
  return {
    monthlyInvestment: clampFinite(Number(values.monthlyInvestment), SIP_DEFAULT_INPUT.monthlyInvestment, SIP_LIMITS.monthlyInvestment.min, SIP_LIMITS.monthlyInvestment.max),
    annualReturnRate: clampFinite(Number(values.annualReturnRate), SIP_DEFAULT_INPUT.annualReturnRate, SIP_LIMITS.annualReturnRate.min, SIP_LIMITS.annualReturnRate.max),
    duration: Math.round(clampFinite(Number(values.duration), SIP_DEFAULT_INPUT.duration, durationLimits.min, durationLimits.max)),
    durationUnit,
  }
}

function formatPeriodLabel(monthsElapsed: number): string {
  return monthsElapsed % 12 === 0 ? `Year ${monthsElapsed / 12}` : `Month ${monthsElapsed}`
}

function toGrowthPoints(schedule: readonly SIPScheduleRow[]) {
  return schedule.map((row) => ({
    label: row.monthsElapsed % 12 === 0 ? `Yr ${row.monthsElapsed / 12}` : `${row.monthsElapsed}mo`,
    invested: row.investedAmount,
    value: row.futureValue,
  }))
}

function toMilestoneItems(schedule: readonly SIPScheduleRow[], totalGain: number): readonly MilestoneItem[] {
  const indices = pickMilestoneIndices(schedule.length)
  return [
    ...indices.map((index) => ({ label: formatPeriodLabel(schedule[index].monthsElapsed), value: formatIndianCurrency(schedule[index].futureValue) })),
    { label: "Total gain", value: formatIndianCurrency(totalGain), highlight: true },
  ]
}

/** The schedule holds cumulative invested/returns totals — derive each period's own contribution
 * so the yearly bar chart shows what was added in that period, not the running total. */
function toYearlyChartData(schedule: readonly SIPScheduleRow[]) {
  let previousInvested = 0
  let previousReturns = 0
  const labels: string[] = []
  const invested: number[] = []
  const returns: number[] = []
  for (const row of schedule) {
    labels.push(formatPeriodLabel(row.monthsElapsed).replace("Year ", "Y").replace("Month ", "M"))
    invested.push(Math.round(row.investedAmount - previousInvested))
    returns.push(Math.round(row.estimatedReturns - previousReturns))
    previousInvested = row.investedAmount
    previousReturns = row.estimatedReturns
  }
  return { labels, invested, returns }
}

export function SIPCalculator() {
  const [values, setValues] = useState<SIPFormValues>(() => toFormValues(SIP_DEFAULT_INPUT))
  const [errors, setErrors] = useState<SIPValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseSIPUrlState(search)))
  })

  function updateValue(field: keyof SIPFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateSIPForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildSIPCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(SIP_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/sip-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateSIP(liveInput), [liveInput])
  const schedule = useMemo(() => calculateSIPSchedule(liveInput), [liveInput])
  const growthPoints = useMemo(() => toGrowthPoints(schedule), [schedule])
  const milestoneItems = useMemo(() => toMilestoneItems(schedule, result.estimatedReturns), [schedule, result.estimatedReturns])
  const durationIsYears = liveInput.durationUnit === "years"

  const yearlyChartData = useMemo(() => toYearlyChartData(schedule), [schedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Invested", values: yearlyChartData.invested, colorVar: "--cat-invest" },
    { label: "Returns", values: yearlyChartData.returns, colorVar: "--gold" },
  ], [yearlyChartData])

  const shareUrl = buildSIPCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator SIP Calculation", "",
    `Monthly investment: ${formatIndianCurrency(liveInput.monthlyInvestment)}`,
    `Expected annual return: ${formatPercentage(liveInput.annualReturnRate)}`,
    `Investment duration: ${liveInput.duration} ${liveInput.durationUnit}`,
    `Total invested: ${formatIndianCurrency(result.totalInvested)}`,
    `Estimated returns: ${formatIndianCurrency(result.estimatedReturns)}`,
    `Estimated future value: ${formatIndianCurrency(result.futureValue)}`,
    "", "Calculator:", `${siteConfig.url}/finance/sip-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">SIP details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="monthly-investment"
                    label="Monthly investment"
                    description="Enter the amount you plan to invest every month."
                    prefix="₹"
                    min={SIP_LIMITS.monthlyInvestment.min}
                    max={SIP_LIMITS.monthlyInvestment.max}
                    step={500}
                    value={values.monthlyInvestment}
                    sliderValue={liveInput.monthlyInvestment}
                    onValueChange={(value) => updateValue("monthlyInvestment", value)}
                    error={errors.monthlyInvestment}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {MONTHLY_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("monthlyInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                  min={SIP_LIMITS.annualReturnRate.min}
                  max={SIP_LIMITS.annualReturnRate.max}
                  step={0.1}
                  sliderMin={1}
                  sliderMax={20}
                  value={values.annualReturnRate}
                  sliderValue={liveInput.annualReturnRate}
                  onValueChange={(value) => updateValue("annualReturnRate", value)}
                  error={errors.annualReturnRate}
                  required
                  accentClassName="accent-cat-invest"
                />

                <PairedNumberSliderInput
                  id="investment-duration"
                  label="Investment duration"
                  description="Enter how long you plan to keep investing."
                  suffix={durationIsYears ? "years" : "months"}
                  min={1}
                  max={durationIsYears ? SIP_LIMITS.durationYears.max : SIP_LIMITS.durationMonths.max}
                  step={1}
                  sliderMin={durationIsYears ? SIP_LIMITS.durationYears.min : SIP_LIMITS.durationMonths.min}
                  sliderMax={durationIsYears ? SIP_LIMITS.durationYears.max : SIP_LIMITS.durationMonths.max}
                  value={values.duration}
                  sliderValue={liveInput.duration}
                  onValueChange={(value) => updateValue("duration", value)}
                  error={errors.duration}
                  required
                  accentClassName="accent-cat-invest"
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
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated future value</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(result.futureValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(result.totalInvested)} invested over {liveInput.duration} {liveInput.durationUnit} at {liveInput.annualReturnRate.toFixed(2)}% p.a.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total invested</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalInvested)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated returns</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.estimatedReturns)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <SimpleDonutChart
                title="Invested vs returns"
                items={[
                  { label: "Invested", value: result.totalInvested, formattedValue: formatIndianCurrency(result.totalInvested), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
                  { label: "Returns", value: result.estimatedReturns, formattedValue: formatIndianCurrency(result.estimatedReturns), colorClass: "bg-gold", ringClass: "stroke-gold" },
                ]}
              />
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="sip-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Growth breakdown</p>
        <h2 id="sip-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Invested vs returns, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one period&apos;s contribution, split by what was invested vs. what came from estimated returns.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartData.labels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of amount invested versus estimated returns for each period of the SIP"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Growth schedule" description="Invested amount vs. estimated total value, year by year. Returns are estimates, not guaranteed.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
          </div>
          <div className="mt-4">
            {scheduleView === "chart" ? (
              <>
                <GrowthLineChart points={growthPoints} investedLabel="Amount invested" valueLabel="Total value (estimated)" />
                <MilestoneRow items={milestoneItems} />
              </>
            ) : (
              <DataTable caption="SIP growth schedule" rows={schedule} columns={scheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
