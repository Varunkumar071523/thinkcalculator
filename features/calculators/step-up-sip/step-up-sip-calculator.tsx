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

export function StepUpSIPCalculator() {
  const [values, setValues] = useState<StepUpSIPFormValues>(() => toFormValues(STEP_UP_SIP_DEFAULT_INPUT))
  const [errors, setErrors] = useState<StepUpSIPValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseStepUpSIPUrlState(search)))
  })

  function updateValue(field: keyof StepUpSIPFormValues, value: string) {
    markInteracted()
    setValues((current) => field === "stepUpMode" ? { ...current, stepUpMode: value, annualStepUpValue: value === "fixed" ? "500" : "10" } : { ...current, [field]: value })
    setErrors((current) => field === "stepUpMode" ? { ...current, stepUpMode: undefined, annualStepUpValue: undefined } : { ...current, [field]: undefined })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateStepUpSIPForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildStepUpSIPCalculatorUrl(validation.data))
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

  const investedPercent = result.estimatedMaturityValue > 0 ? Math.round((result.totalInvested / result.estimatedMaturityValue) * 100) : 100
  const returnsPercent = 100 - investedPercent

  const shareUrl = buildStepUpSIPCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
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
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <CalculatorNumberInput id="initial-monthly-investment" label="Initial monthly SIP" description="Enter the SIP amount you'll start with in year one." prefix="₹" min={STEP_UP_SIP_LIMITS.initialMonthlyInvestment.min} max={STEP_UP_SIP_LIMITS.initialMonthlyInvestment.max} step={500} value={values.initialMonthlyInvestment} onValueChange={(value) => updateValue("initialMonthlyInvestment", value)} error={errors.initialMonthlyInvestment} required />
                  <input type="range" aria-label="Initial monthly SIP slider" min={STEP_UP_SIP_LIMITS.initialMonthlyInvestment.min} max={STEP_UP_SIP_LIMITS.initialMonthlyInvestment.max} step={500} value={liveInput.initialMonthlyInvestment} onChange={(event) => updateValue("initialMonthlyInvestment", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  <div className="mt-2 flex gap-1.5">
                    {MONTHLY_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("initialMonthlyInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <CalculatorSelectInput id="step-up-mode" label="Step-up method" value={values.stepUpMode} onValueChange={(value) => updateValue("stepUpMode", value)} options={[{ label: "Percentage increase", value: "percentage" }, { label: "Fixed rupee increase", value: "fixed" }]} error={errors.stepUpMode} required />

                <div>
                  <CalculatorNumberInput id="annual-step-up" label={isPercentageMode ? "Annual step-up percentage" : "Annual step-up amount"} description={isPercentageMode ? "10% means the monthly SIP increases by 10% after every 12 contributions." : "₹1,000 means the monthly SIP increases by ₹1,000 after every 12 contributions."} prefix={isPercentageMode ? undefined : "₹"} suffix={isPercentageMode ? "%" : undefined} min={0} max={isPercentageMode ? STEP_UP_SIP_LIMITS.annualStepUpPercentage.max : STEP_UP_SIP_LIMITS.annualStepUpFixed.max} step={isPercentageMode ? 0.5 : 100} value={values.annualStepUpValue} onValueChange={(value) => updateValue("annualStepUpValue", value)} error={errors.annualStepUpValue} required />
                  <input type="range" aria-label="Annual step-up slider" min={0} max={isPercentageMode ? 30 : 5_000} step={isPercentageMode ? 0.5 : 100} value={liveInput.annualStepUpValue} onChange={(event) => updateValue("annualStepUpValue", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div>
                  <CalculatorNumberInput id="expected-return" label="Expected annual return assumption" description="A constant modelling assumption for this scenario, not a forecast or guaranteed return." suffix="%" min={STEP_UP_SIP_LIMITS.expectedAnnualReturn.min} max={STEP_UP_SIP_LIMITS.expectedAnnualReturn.max} step={0.1} value={values.expectedAnnualReturn} onValueChange={(value) => updateValue("expectedAnnualReturn", value)} error={errors.expectedAnnualReturn} required />
                  <input type="range" aria-label="Expected annual return slider" min={1} max={20} step={0.1} value={liveInput.expectedAnnualReturn} onChange={(event) => updateValue("expectedAnnualReturn", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div>
                  <CalculatorNumberInput id="duration-years" label="Investment duration" suffix="years" min={STEP_UP_SIP_LIMITS.durationYears.min} max={STEP_UP_SIP_LIMITS.durationYears.max} step={1} value={values.durationYears} onValueChange={(value) => updateValue("durationYears", value)} error={errors.durationYears} required />
                  <input type="range" aria-label="Investment duration slider" min={STEP_UP_SIP_LIMITS.durationYears.min} max={STEP_UP_SIP_LIMITS.durationYears.max} step={1} value={liveInput.durationYears} onChange={(event) => updateValue("durationYears", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate Step-up SIP</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
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

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator Step-up SIP Estimate"
          calculationDate={calculationDate}
          disclaimer="Market returns are uncertain and not guaranteed. Ensure future contribution increases remain affordable."
          items={[
            { label: "Initial monthly SIP", value: formatIndianCurrency(liveInput.initialMonthlyInvestment) },
            { label: "Step-up method", value: isPercentageMode ? "Percentage" : "Fixed amount" },
            { label: "Annual step-up value", value: isPercentageMode ? formatPercentage(liveInput.annualStepUpValue) : formatIndianCurrency(liveInput.annualStepUpValue) },
            { label: "Expected annual return assumption", value: formatPercentage(liveInput.expectedAnnualReturn) },
            { label: "Duration", value: `${liveInput.durationYears} years` },
            { label: "Total invested", value: formatIndianCurrency(result.totalInvested) },
            { label: "Estimated returns", value: formatIndianCurrency(result.estimatedReturns) },
            { label: "Estimated maturity value", value: formatIndianCurrency(result.estimatedMaturityValue) },
            { label: "Regular SIP maturity value", value: formatIndianCurrency(result.regularSipMaturityValue) },
            { label: "Difference in estimated maturity value", value: formatIndianCurrency(result.maturityValueDifference) },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="step-up-sip-schedule-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Growth over time</p>
            <h2 id="step-up-sip-schedule-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">How your step-up SIP grows</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">Cumulative invested amount vs. estimated year-end value. Each increase starts only after a completed block of 12 contributions.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
        </div>
        <div className="mt-6">
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
      </section>
    </div>
  )
}
