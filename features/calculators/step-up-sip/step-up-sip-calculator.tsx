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
import { calculateStepUpSIP } from "@/features/calculators/step-up-sip/calculate-step-up-sip"
import { parseAndValidateStepUpSIPForm, STEP_UP_SIP_LIMITS, type StepUpSIPFormValues } from "@/features/calculators/step-up-sip/step-up-sip-schema"
import type { StepUpMode, StepUpSIPInput, StepUpSIPScheduleRow, StepUpSIPValidationErrors } from "@/features/calculators/step-up-sip/step-up-sip-types"
import { buildStepUpSIPCalculatorUrl, STEP_UP_SIP_DEFAULT_INPUT, parseStepUpSIPUrlState } from "@/features/calculators/step-up-sip/step-up-sip-url-state"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const MONTHLY_QUICK_AMOUNTS = [
  { label: "2K", value: "2000" },
  { label: "5K", value: "5000" },
  { label: "10K", value: "10000" },
  { label: "25K", value: "25000" },
]

const scheduleColumns: readonly DataTableColumn<StepUpSIPScheduleRow>[] = [
  { header: "Year", cell: (row) => row.year },
  { header: "Monthly SIP", cell: (row) => formatIndianCurrency(row.monthlyContributionAtStart) },
  { header: "Annual contribution", cell: (row) => formatIndianCurrency(row.annualContribution) },
  { header: "Cumulative invested", cell: (row) => formatIndianCurrency(row.cumulativeInvestment) },
  { header: "Estimated year-end value", cell: (row) => formatIndianCurrency(row.estimatedYearEndValue) },
]

function toFormValues(input: StepUpSIPInput): StepUpSIPFormValues {
  return { initialMonthlyInvestment: String(input.initialMonthlyInvestment), stepUpMode: input.stepUpMode, annualStepUpValue: String(input.annualStepUpValue), expectedAnnualReturn: String(input.expectedAnnualReturn), durationYears: String(input.durationYears) }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isStepUpMode(value: string): value is StepUpMode {
  return value === "percentage" || value === "fixed"
}

/** The schema's own safety check rejects step-up combinations whose final contribution would exceed
 * a safe numeric range (see step-up-sip-schema.ts). Live recalculation runs on every slider tick
 * before that full validation pass, so this halves the step-up value until the projection is safe —
 * keeping the live preview always renderable instead of throwing mid-drag on an extreme combination. */
function clampStepUpForSafety(input: StepUpSIPInput): StepUpSIPInput {
  if (input.annualStepUpValue <= 0 || input.durationYears <= 1) return input
  const lastContribution = (stepUp: number) => input.stepUpMode === "percentage"
    ? input.initialMonthlyInvestment * Math.pow(1 + stepUp / 100, input.durationYears - 1)
    : input.initialMonthlyInvestment + stepUp * (input.durationYears - 1)
  let stepUp = input.annualStepUpValue
  while (stepUp > 0 && (!Number.isFinite(lastContribution(stepUp)) || lastContribution(stepUp) > Number.MAX_SAFE_INTEGER)) {
    stepUp = stepUp / 2 < 1e-6 ? 0 : stepUp / 2
  }
  return stepUp === input.annualStepUpValue ? input : { ...input, annualStepUpValue: stepUp }
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: StepUpSIPFormValues): StepUpSIPInput {
  const stepUpMode: StepUpMode = isStepUpMode(values.stepUpMode) ? values.stepUpMode : "percentage"
  const stepUpLimits = stepUpMode === "fixed" ? STEP_UP_SIP_LIMITS.annualStepUpFixed : STEP_UP_SIP_LIMITS.annualStepUpPercentage
  return clampStepUpForSafety({
    initialMonthlyInvestment: clampFinite(Number(values.initialMonthlyInvestment), STEP_UP_SIP_DEFAULT_INPUT.initialMonthlyInvestment, STEP_UP_SIP_LIMITS.initialMonthlyInvestment.min, STEP_UP_SIP_LIMITS.initialMonthlyInvestment.max),
    stepUpMode,
    annualStepUpValue: clampFinite(Number(values.annualStepUpValue), 0, stepUpLimits.min, stepUpLimits.max),
    expectedAnnualReturn: clampFinite(Number(values.expectedAnnualReturn), STEP_UP_SIP_DEFAULT_INPUT.expectedAnnualReturn, STEP_UP_SIP_LIMITS.expectedAnnualReturn.min, STEP_UP_SIP_LIMITS.expectedAnnualReturn.max),
    durationYears: Math.round(clampFinite(Number(values.durationYears), STEP_UP_SIP_DEFAULT_INPUT.durationYears, STEP_UP_SIP_LIMITS.durationYears.min, STEP_UP_SIP_LIMITS.durationYears.max)),
  })
}

function toGrowthPoints(schedule: readonly StepUpSIPScheduleRow[]) {
  return schedule.map((row) => ({ label: `Yr ${row.year}`, invested: row.cumulativeInvestment, value: row.estimatedYearEndValue }))
}

function toMilestoneItems(schedule: readonly StepUpSIPScheduleRow[], totalGain: number): readonly MilestoneItem[] {
  const indices = pickMilestoneIndices(schedule.length)
  return [
    ...indices.map((index) => ({ label: `Year ${schedule[index].year}`, value: formatIndianCurrency(schedule[index].estimatedYearEndValue) })),
    { label: "Total gain", value: formatIndianCurrency(totalGain), highlight: true },
  ]
}

/** annualContribution is already this year's own invested amount; the returns share is derived as
 * the year's growth in estimated value left over after that contribution. */
function toYearlyChartData(schedule: readonly StepUpSIPScheduleRow[]) {
  let previousValue = 0
  const labels: string[] = []
  const invested: number[] = []
  const returns: number[] = []
  for (const row of schedule) {
    labels.push(`Y${row.year}`)
    invested.push(Math.round(row.annualContribution))
    returns.push(Math.round(row.estimatedYearEndValue - previousValue - row.annualContribution))
    previousValue = row.estimatedYearEndValue
  }
  return { labels, invested, returns }
}

export function StepUpSIPCalculator() {
  const [values, setValues] = useState<StepUpSIPFormValues>(() => toFormValues(STEP_UP_SIP_DEFAULT_INPUT))
  const [errors, setErrors] = useState<StepUpSIPValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseStepUpSIPUrlState(search)))
  })

  function updateValue(field: keyof StepUpSIPFormValues, value: string) {
    markInteracted()
    const nextValues = field === "stepUpMode" ? { ...values, stepUpMode: value, annualStepUpValue: value === "fixed" ? "500" : "10" } : { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateStepUpSIPForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildStepUpSIPCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(STEP_UP_SIP_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/step-up-sip-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateStepUpSIP(liveInput), [liveInput])
  const growthPoints = useMemo(() => toGrowthPoints(result.schedule), [result.schedule])
  const milestoneItems = useMemo(() => toMilestoneItems(result.schedule, result.estimatedReturns), [result.schedule, result.estimatedReturns])
  const isPercentageMode = liveInput.stepUpMode === "percentage"

  const yearlyChartData = useMemo(() => toYearlyChartData(result.schedule), [result.schedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Invested", values: yearlyChartData.invested, colorVar: "--cat-invest" },
    { label: "Returns", values: yearlyChartData.returns, colorVar: "--gold" },
  ], [yearlyChartData])

  const shareUrl = buildStepUpSIPCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator Step-up SIP Estimate", "",
    `Initial monthly SIP: ${formatIndianCurrency(liveInput.initialMonthlyInvestment)}`,
    `Step-up method: ${isPercentageMode ? "Percentage" : "Fixed amount"}`,
    `Annual step-up value: ${isPercentageMode ? formatPercentage(liveInput.annualStepUpValue) : formatIndianCurrency(liveInput.annualStepUpValue)}`,
    `Expected annual return assumption: ${formatPercentage(liveInput.expectedAnnualReturn)}`,
    `Duration: ${liveInput.durationYears} years`,
    `Total invested: ${formatIndianCurrency(result.totalInvested)}`,
    `Estimated returns: ${formatIndianCurrency(result.estimatedReturns)}`,
    `Estimated maturity value: ${formatIndianCurrency(result.estimatedMaturityValue)}`,
    `Final monthly SIP: ${formatIndianCurrency(result.finalMonthlyInvestment)}`,
    `Regular SIP maturity value: ${formatIndianCurrency(result.regularSipMaturityValue)}`,
    `Additional amount invested vs. regular SIP: ${formatIndianCurrency(result.additionalInvestment)}`,
    `Difference in estimated maturity value: ${formatIndianCurrency(result.maturityValueDifference)}`,
    "Returns are market-linked estimates and are not guaranteed. Future contribution increases must remain affordable.",
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Step-up SIP details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="initial-monthly-investment"
                    label="Initial monthly SIP"
                    description="Enter the SIP amount you'll start with in year one."
                    prefix="₹"
                    min={STEP_UP_SIP_LIMITS.initialMonthlyInvestment.min}
                    max={STEP_UP_SIP_LIMITS.initialMonthlyInvestment.max}
                    step={500}
                    value={values.initialMonthlyInvestment}
                    sliderValue={liveInput.initialMonthlyInvestment}
                    onValueChange={(value) => updateValue("initialMonthlyInvestment", value)}
                    error={errors.initialMonthlyInvestment}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {MONTHLY_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("initialMonthlyInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <CalculatorSelectInput id="step-up-mode" label="Step-up method" value={values.stepUpMode} onValueChange={(value) => updateValue("stepUpMode", value)} options={[{ label: "Percentage increase", value: "percentage" }, { label: "Fixed rupee increase", value: "fixed" }]} error={errors.stepUpMode} required />

                <PairedNumberSliderInput
                  id="annual-step-up"
                  label={isPercentageMode ? "Annual step-up percentage" : "Annual step-up amount"}
                  description={isPercentageMode ? "10% means the monthly SIP increases by 10% after every 12 contributions." : "₹1,000 means the monthly SIP increases by ₹1,000 after every 12 contributions."}
                  prefix={isPercentageMode ? undefined : "₹"}
                  suffix={isPercentageMode ? "%" : undefined}
                  min={0}
                  max={isPercentageMode ? STEP_UP_SIP_LIMITS.annualStepUpPercentage.max : STEP_UP_SIP_LIMITS.annualStepUpFixed.max}
                  step={isPercentageMode ? 0.5 : 100}
                  sliderMin={0}
                  sliderMax={isPercentageMode ? 30 : 5_000}
                  value={values.annualStepUpValue}
                  sliderValue={liveInput.annualStepUpValue}
                  onValueChange={(value) => updateValue("annualStepUpValue", value)}
                  error={errors.annualStepUpValue}
                  required
                  accentClassName="accent-cat-invest"
                />

                <PairedNumberSliderInput
                  id="expected-return"
                  label="Expected annual return assumption"
                  description="A constant modelling assumption for this scenario, not a forecast or guaranteed return."
                  suffix="%"
                  min={STEP_UP_SIP_LIMITS.expectedAnnualReturn.min}
                  max={STEP_UP_SIP_LIMITS.expectedAnnualReturn.max}
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

                <PairedNumberSliderInput
                  id="duration-years"
                  label="Investment duration"
                  suffix="years"
                  min={STEP_UP_SIP_LIMITS.durationYears.min}
                  max={STEP_UP_SIP_LIMITS.durationYears.max}
                  step={1}
                  value={values.durationYears}
                  sliderValue={liveInput.durationYears}
                  onValueChange={(value) => updateValue("durationYears", value)}
                  error={errors.durationYears}
                  required
                  accentClassName="accent-cat-invest"
                />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated maturity value</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(result.estimatedMaturityValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(result.totalInvested)} invested over {liveInput.durationYears} years, final monthly SIP {formatIndianCurrency(result.finalMonthlyInvestment)}</p>
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

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Regular SIP comparison</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">What the same starting amount would have grown to without any step-up.</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-muted/30 p-3.5"><dt className="text-xs text-muted-foreground">Regular SIP maturity value</dt><dd className="mt-1 font-mono text-lg font-semibold">{formatIndianCurrency(result.regularSipMaturityValue)}</dd></div>
              <div className="rounded-lg border border-line bg-muted/30 p-3.5"><dt className="text-xs text-muted-foreground">Additional amount invested</dt><dd className="mt-1 font-mono text-lg font-semibold">{formatIndianCurrency(result.additionalInvestment)}</dd></div>
              <div className="rounded-lg border border-line bg-muted/30 p-3.5 sm:col-span-2"><dt className="text-xs text-muted-foreground">Difference in estimated maturity value</dt><dd className="mt-1 font-mono text-lg font-semibold text-cat-invest">{formatIndianCurrency(result.maturityValueDifference)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="step-up-sip-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Growth breakdown</p>
        <h2 id="step-up-sip-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Invested vs returns, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s contribution, split by what was invested vs. what came from estimated returns.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartData.labels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of amount invested versus estimated returns for each year of the step-up SIP"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Growth schedule" description="Cumulative invested amount vs. estimated year-end value. Each increase starts only after a completed block of 12 contributions.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
          </div>
          <div className="mt-4">
            {scheduleView === "chart" ? (
              <>
                <GrowthLineChart points={growthPoints} investedLabel="Cumulative invested" valueLabel="Estimated year-end value" />
                <MilestoneRow items={milestoneItems} />
              </>
            ) : (
              <DataTable caption="Step-up SIP yearly schedule" rows={result.schedule} columns={scheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed currency is rounded to two decimal places; calculations retain full precision.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
