"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { DecliningBalanceChart, MilestoneRow, pickMilestoneIndices, type MilestoneItem } from "@/components/calculators/growth-area-chart"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { calculateSWP } from "@/features/calculators/swp/calculate-swp"
import { parseAndValidateSWPForm, SWP_LIMITS, type SWPFormValues } from "@/features/calculators/swp/swp-schema"
import type { SWPInput, SWPValidationErrors, SWPWithdrawalMode, SWPYearlyScheduleRow } from "@/features/calculators/swp/swp-types"
import { buildSWPCalculatorUrl, SWP_DEFAULT_INPUT, parseSWPUrlState } from "@/features/calculators/swp/swp-url-state"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const INITIAL_QUICK_AMOUNTS = [
  { label: "10L", value: "1000000" },
  { label: "25L", value: "2500000" },
  { label: "50L", value: "5000000" },
  { label: "1Cr", value: "10000000" },
]

const scheduleColumns: readonly DataTableColumn<SWPYearlyScheduleRow>[] = [
  { header: "Year", cell: (row) => row.year },
  { header: "Opening balance", cell: (row) => formatIndianCurrency(row.openingBalance) },
  { header: "Withdrawals in year", cell: (row) => formatIndianCurrency(row.withdrawalsInYear) },
  { header: "Growth in year", cell: (row) => formatIndianCurrency(row.growthInYear) },
  { header: "Closing balance", cell: (row) => row.isExhaustionYear ? `${formatIndianCurrency(row.closingBalance)} (exhausted)` : formatIndianCurrency(row.closingBalance) },
]

function toFormValues(input: SWPInput): SWPFormValues {
  return { initialInvestment: String(input.initialInvestment), monthlyWithdrawal: String(input.monthlyWithdrawal), expectedAnnualReturn: String(input.expectedAnnualReturn), withdrawalMode: input.withdrawalMode, durationYears: String(input.durationYears) }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isWithdrawalMode(value: string): value is SWPWithdrawalMode {
  return value === "fixedDuration" || value === "untilExhausted"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: SWPFormValues): SWPInput {
  const withdrawalMode: SWPWithdrawalMode = isWithdrawalMode(values.withdrawalMode) ? values.withdrawalMode : "fixedDuration"
  return {
    initialInvestment: clampFinite(Number(values.initialInvestment), SWP_DEFAULT_INPUT.initialInvestment, SWP_LIMITS.initialInvestment.min, SWP_LIMITS.initialInvestment.max),
    monthlyWithdrawal: clampFinite(Number(values.monthlyWithdrawal), SWP_DEFAULT_INPUT.monthlyWithdrawal, SWP_LIMITS.monthlyWithdrawal.min, SWP_LIMITS.monthlyWithdrawal.max),
    expectedAnnualReturn: clampFinite(Number(values.expectedAnnualReturn), SWP_DEFAULT_INPUT.expectedAnnualReturn, SWP_LIMITS.expectedAnnualReturn.min, SWP_LIMITS.expectedAnnualReturn.max),
    withdrawalMode,
    durationYears: Math.round(clampFinite(Number(values.durationYears), SWP_DEFAULT_INPUT.durationYears, SWP_LIMITS.durationYears.min, SWP_LIMITS.durationYears.max)),
  }
}

function formatDurationText(months: number): string {
  const years = Math.floor(months / 12)
  const remainder = months % 12
  if (years === 0) return `${remainder} month${remainder === 1 ? "" : "s"}`
  if (remainder === 0) return `${years} year${years === 1 ? "" : "s"}`
  return `${years} year${years === 1 ? "" : "s"} ${remainder} month${remainder === 1 ? "" : "s"}`
}

function toBalancePoints(schedule: readonly SWPYearlyScheduleRow[], initialInvestment: number) {
  return [
    { label: "Start", balance: initialInvestment },
    ...schedule.map((row) => ({ label: `Yr ${row.year}`, balance: row.closingBalance })),
  ]
}

function toMilestoneItems(schedule: readonly SWPYearlyScheduleRow[], totalWithdrawn: number): readonly MilestoneItem[] {
  const indices = pickMilestoneIndices(schedule.length)
  return [
    ...indices.map((index) => {
      const row = schedule[index]
      const value = row.isExhaustionYear ? `${formatIndianCurrency(row.closingBalance)} (exhausted)` : formatIndianCurrency(row.closingBalance)
      return { label: `Year ${row.year}`, value }
    }),
    { label: "Total withdrawn", value: formatIndianCurrency(totalWithdrawn), highlight: true },
  ]
}

export function SWPCalculator() {
  const [values, setValues] = useState<SWPFormValues>(() => toFormValues(SWP_DEFAULT_INPUT))
  const [errors, setErrors] = useState<SWPValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseSWPUrlState(search)))
  })

  function updateValue(field: keyof SWPFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateSWPForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildSWPCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(SWP_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/swp-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateSWP(liveInput), [liveInput])
  const balancePoints = useMemo(() => toBalancePoints(result.schedule, liveInput.initialInvestment), [result.schedule, liveInput.initialInvestment])
  const milestoneItems = useMemo(() => toMilestoneItems(result.schedule, result.totalWithdrawn), [result.schedule, result.totalWithdrawn])
  const isFixedDuration = liveInput.withdrawalMode === "fixedDuration"

  const primaryLabel = result.isExhausted ? "Balance exhausted after" : result.cappedAtMaxDuration ? "Remaining balance at the 100-year cap" : "Remaining balance"
  const primaryValue = result.isExhausted ? formatDurationText(result.exhaustionMonth!) : formatIndianCurrency(result.remainingBalance)
  const subtitle = result.isExhausted
    ? `Remaining balance: ${formatIndianCurrency(result.remainingBalance)}`
    : `over ${formatDurationText(result.monthsSimulated)} at ${liveInput.expectedAnnualReturn.toFixed(2)}% p.a.`

  const yearlyChartLabels = useMemo(() => result.schedule.map((row) => `Y${row.year}`), [result.schedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Withdrawals", values: result.schedule.map((row) => Math.round(row.withdrawalsInYear)), colorVar: "--cat-invest" },
    { label: "Growth", values: result.schedule.map((row) => Math.round(row.growthInYear)), colorVar: "--gold" },
  ], [result.schedule])

  const shareUrl = buildSWPCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator SWP Estimate", "",
    `Initial investment: ${formatIndianCurrency(liveInput.initialInvestment)}`,
    `Monthly withdrawal: ${formatIndianCurrency(liveInput.monthlyWithdrawal)}`,
    `Expected annual return assumption: ${formatPercentage(liveInput.expectedAnnualReturn)}`,
    `Withdrawal duration: ${isFixedDuration ? `${liveInput.durationYears} years, fixed` : "Until balance is exhausted"}`,
    `Total withdrawn: ${formatIndianCurrency(result.totalWithdrawn)}`,
    `Total growth: ${formatIndianCurrency(result.totalGrowth)}`,
    `Remaining balance: ${formatIndianCurrency(result.remainingBalance)}`,
    `Balance exhausted: ${result.isExhausted ? `Yes, after ${formatDurationText(result.exhaustionMonth!)}` : "No"}`,
    result.cappedAtMaxDuration ? "Note: the balance was not exhausted within the 100-year simulation cap." : "",
    "Returns are market-linked estimates and are not guaranteed. This projection excludes taxation of withdrawals and product-specific rules.",
  ].filter(Boolean).join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">SWP details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="initial-investment"
                    label="Initial investment"
                    description="Enter the corpus you'll withdraw from."
                    prefix="₹"
                    min={SWP_LIMITS.initialInvestment.min}
                    max={SWP_LIMITS.initialInvestment.max}
                    step={10_000}
                    value={values.initialInvestment}
                    sliderValue={liveInput.initialInvestment}
                    onValueChange={(value) => updateValue("initialInvestment", value)}
                    error={errors.initialInvestment}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {INITIAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("initialInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="monthly-withdrawal"
                  label="Monthly withdrawal"
                  description="Enter the fixed amount to withdraw every month."
                  prefix="₹"
                  min={SWP_LIMITS.monthlyWithdrawal.min}
                  max={SWP_LIMITS.monthlyWithdrawal.max}
                  step={500}
                  value={values.monthlyWithdrawal}
                  sliderValue={liveInput.monthlyWithdrawal}
                  onValueChange={(value) => updateValue("monthlyWithdrawal", value)}
                  error={errors.monthlyWithdrawal}
                  required
                  accentClassName="accent-cat-invest"
                />

                <PairedNumberSliderInput
                  id="expected-return"
                  label="Expected annual return assumption"
                  description="A constant modelling assumption for this scenario, not a forecast or guaranteed return."
                  suffix="%"
                  min={SWP_LIMITS.expectedAnnualReturn.min}
                  max={SWP_LIMITS.expectedAnnualReturn.max}
                  step={0.1}
                  sliderMin={1}
                  sliderMax={20}
                  value={values.expectedAnnualReturn}
                  sliderValue={liveInput.expectedAnnualReturn}
                  onValueChange={(value) => updateValue("expectedAnnualReturn", value)}
                  error={errors.expectedAnnualReturn}
                  required
                  accentClassName="accent-cat-invest"
                />

                <CalculatorSelectInput id="withdrawal-mode" label="Withdrawal duration" value={values.withdrawalMode} onValueChange={(value) => updateValue("withdrawalMode", value)} options={[{ label: "Fixed duration", value: "fixedDuration" }, { label: "Until balance is exhausted", value: "untilExhausted" }]} error={errors.withdrawalMode} required />

                {isFixedDuration ? (
                  <PairedNumberSliderInput
                    id="duration-years"
                    label="Withdrawal duration"
                    suffix="years"
                    min={SWP_LIMITS.durationYears.min}
                    max={SWP_LIMITS.durationYears.max}
                    step={1}
                    value={values.durationYears}
                    sliderValue={liveInput.durationYears}
                    onValueChange={(value) => updateValue("durationYears", value)}
                    error={errors.durationYears}
                    required
                    accentClassName="accent-cat-invest"
                  />
                ) : null}

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">{primaryLabel}</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{primaryValue}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total withdrawn</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalWithdrawn)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total growth</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalGrowth)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Final withdrawal amount</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.finalWithdrawalAmount)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Duration simulated</p>
                <p className="font-mono text-lg font-semibold">{formatDurationText(result.monthsSimulated)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <SimpleDonutChart
                title="Withdrawals vs growth"
                items={[
                  { label: "Withdrawals", value: result.totalWithdrawn, formattedValue: formatIndianCurrency(result.totalWithdrawn), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
                  { label: "Growth", value: result.totalGrowth, formattedValue: formatIndianCurrency(result.totalGrowth), colorClass: "bg-gold", ringClass: "stroke-gold" },
                ]}
              />
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="swp-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Withdrawal breakdown</p>
        <h2 id="swp-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Withdrawals vs growth, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s change in the corpus, split by what was withdrawn vs. growth earned that year.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartLabels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of withdrawals versus growth for each year of the SWP"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Balance schedule" description="Each year's withdrawals are taken before that year's growth is applied to the remaining balance.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
          </div>
          <div className="mt-4">
            {scheduleView === "chart" ? (
              <>
                <DecliningBalanceChart points={balancePoints} label="Balance" />
                <MilestoneRow items={milestoneItems} />
              </>
            ) : (
              <DataTable caption="SWP yearly balance schedule" rows={result.schedule} columns={scheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed currency is rounded to two decimal places; calculations retain full precision.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
