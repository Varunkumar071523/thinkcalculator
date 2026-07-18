"use client"

import { useMemo, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { GrowthLineChart, MilestoneRow, pickMilestoneIndices, type MilestoneItem } from "@/components/calculators/growth-area-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
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

export function LumpsumCalculator() {
  const [values, setValues] = useState<LumpsumFormValues>(() => toFormValues(LUMPSUM_DEFAULT_INPUT))
  const [errors, setErrors] = useState<LumpsumValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseLumpsumUrlState(search)))
  })

  function updateValue(field: keyof LumpsumFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateLumpsumForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildLumpsumCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(LUMPSUM_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/lumpsum-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateLumpsum(liveInput), [liveInput])
  const schedule = useMemo(() => calculateLumpsumSchedule(liveInput), [liveInput])
  const growthPoints = useMemo(() => toGrowthPoints(schedule), [schedule])
  const milestoneItems = useMemo(() => toMilestoneItems(schedule, result.estimatedReturns), [schedule, result.estimatedReturns])
  const durationIsYears = liveInput.durationUnit === "years"

  const investedPercent = result.futureValue > 0 ? Math.round((result.initialInvestment / result.futureValue) * 100) : 100
  const returnsPercent = 100 - investedPercent

  const shareUrl = buildLumpsumCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
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
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <CalculatorNumberInput id="initial-investment" label="Initial investment" description="Enter the one-time amount you plan to invest." prefix="₹" min={LUMPSUM_LIMITS.initialInvestment.min} max={LUMPSUM_LIMITS.initialInvestment.max} step={1_000} value={values.initialInvestment} onValueChange={(value) => updateValue("initialInvestment", value)} error={errors.initialInvestment} required />
                  <input type="range" aria-label="Initial investment slider" min={LUMPSUM_LIMITS.initialInvestment.min} max={LUMPSUM_LIMITS.initialInvestment.max} step={1_000} value={liveInput.initialInvestment} onChange={(event) => updateValue("initialInvestment", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  <div className="mt-2 flex gap-1.5">
                    {PRINCIPAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("initialInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <CalculatorNumberInput id="annual-return-rate" label="Expected annual return" description="Enter the return you expect the investment to earn each year." suffix="%" min={LUMPSUM_LIMITS.annualReturnRate.min} max={LUMPSUM_LIMITS.annualReturnRate.max} step={0.1} value={values.annualReturnRate} onValueChange={(value) => updateValue("annualReturnRate", value)} error={errors.annualReturnRate} required />
                  <input type="range" aria-label="Expected annual return slider" min={1} max={20} step={0.1} value={liveInput.annualReturnRate} onChange={(event) => updateValue("annualReturnRate", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div>
                  <CalculatorNumberInput id="investment-duration" label="Investment duration" description="Enter how long the investment will stay invested." suffix={durationIsYears ? "years" : "months"} min={1} max={durationIsYears ? LUMPSUM_LIMITS.durationYears.max : LUMPSUM_LIMITS.durationMonths.max} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
                  <input type="range" aria-label="Investment duration slider" min={durationIsYears ? LUMPSUM_LIMITS.durationYears.min : LUMPSUM_LIMITS.durationMonths.min} max={durationIsYears ? LUMPSUM_LIMITS.durationYears.max : LUMPSUM_LIMITS.durationMonths.max} step={1} value={liveInput.duration} onChange={(event) => updateValue("duration", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>
                <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate value</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated future value</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(result.futureValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(result.initialInvestment)} invested over {liveInput.duration} {liveInput.durationUnit} at {liveInput.annualReturnRate.toFixed(2)}% p.a.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Initial investment</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.initialInvestment)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated returns</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.estimatedReturns)}</p>
              </div>
            </div>

            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={`Invested ${investedPercent}%, returns ${returnsPercent}%`}>
              <div className="bg-cat-invest" style={{ width: `${investedPercent}%` }} />
              <div className="border border-gold bg-gold-soft" style={{ width: `${returnsPercent}%` }} />
            </div>
            <div className="mt-2.5 flex gap-4.5 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-cat-invest" aria-hidden="true" />Invested {investedPercent}%</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-gold bg-gold-soft" aria-hidden="true" />Returns {returnsPercent}%</span>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator Lumpsum Calculation"
          calculationDate={calculationDate}
          disclaimer="Returns are estimates for informational purposes only and are not guaranteed."
          items={[
            { label: "Initial investment", value: formatIndianCurrency(liveInput.initialInvestment) },
            { label: "Expected annual return", value: formatPercentage(liveInput.annualReturnRate) },
            { label: "Investment duration", value: `${liveInput.duration} ${liveInput.durationUnit}` },
            { label: "Estimated returns", value: formatIndianCurrency(result.estimatedReturns) },
            { label: "Estimated future value", value: formatIndianCurrency(result.futureValue) },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="lumpsum-schedule-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Growth over time</p>
            <h2 id="lumpsum-schedule-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">How your investment grows</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">Initial investment vs. estimated total value, year by year. Returns are estimates, not guaranteed.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
        </div>
        <div className="mt-6">
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
      </section>
    </div>
  )
}
