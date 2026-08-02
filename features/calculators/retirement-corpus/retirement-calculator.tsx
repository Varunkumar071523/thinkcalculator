"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { MilestoneRow, pickMilestoneIndices, TwoPhaseChart, type MilestoneItem, type TwoPhaseChartPoint } from "@/components/calculators/growth-area-chart"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateRetirement } from "./calculate-retirement"
import { parseAndValidateRetirementForm, RETIREMENT_LIMITS, type RetirementFormValues } from "./retirement-schema"
import type { RetirementAccumulationScheduleRow, RetirementDecumulationScheduleRow, RetirementInput, RetirementResult, RetirementValidationErrors } from "./retirement-types"
import { buildRetirementCalculatorUrl, parseRetirementUrlState, RETIREMENT_DEFAULT_INPUT } from "./retirement-url-state"

function toFormValues(input: RetirementInput): RetirementFormValues {
  return {
    currentAge: String(input.currentAge),
    retirementAge: String(input.retirementAge),
    lifeExpectancy: String(input.lifeExpectancy),
    currentSavings: String(input.currentSavings),
    monthlyContribution: String(input.monthlyContribution),
    expectedReturnPreRetirement: String(input.expectedReturnPreRetirement),
    expectedReturnPostRetirement: String(input.expectedReturnPostRetirement),
    desiredMonthlyWithdrawal: String(input.desiredMonthlyWithdrawal),
    inflationRate: String(input.inflationRate),
  }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Keeps the accumulation-phase corpus (current savings + monthly contributions compounding for up
 * to 62 years at up to 50% p.a.) inside a safe numeric range during live recalculation, by backing
 * off the pre-retirement return. This mirrors the exact closed-form check validateRetirementInput
 * runs on submit (see retirement-schema.ts's "safety net" comment) — calculateRetirement calls that
 * same validator and throws on a rejected combination, so live preview needs the same live-preview-
 * only backoff CAGR/Step-up SIP use elsewhere in this batch. Full validation is unchanged on
 * submit/share. At 0% return the corpus is bounded by currentSavings + monthlyContribution × months
 * (≤ ~8.4e9 at every field's maximum), always well inside the safe range, so the loop always
 * terminates. */
function clampPreRetirementForSafety(input: RetirementInput): RetirementInput {
  if (input.currentSavings <= 0 && input.monthlyContribution <= 0) return input
  const months = (input.retirementAge - input.currentAge) * 12
  const projectedCorpus = (annualRate: number) => {
    const monthlyRate = annualRate / 12 / 100
    return monthlyRate === 0
      ? input.currentSavings + input.monthlyContribution * months
      : input.currentSavings * Math.pow(1 + monthlyRate, months) + input.monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
  }
  let rate = input.expectedReturnPreRetirement
  while (rate > 0 && (!Number.isFinite(projectedCorpus(rate)) || projectedCorpus(rate) > Number.MAX_SAFE_INTEGER)) {
    rate = rate / 2 < 0.01 ? 0 : rate / 2
  }
  return rate === input.expectedReturnPreRetirement ? input : { ...input, expectedReturnPreRetirement: rate }
}

/** Keeps the inflation-escalated final retirement-year withdrawal (up to 91 years of compounding at
 * up to 50% inflation) inside a safe numeric range during live recalculation, by backing off the
 * inflation rate — the same reasoning and the schema's other named "safety net" vector, see
 * clampPreRetirementForSafety above. At 0% inflation the last year's withdrawal equals
 * desiredMonthlyWithdrawal itself (≤ 1e7), always safe, so the loop always terminates. */
function clampWithdrawalForSafety(input: RetirementInput): RetirementInput {
  if (input.desiredMonthlyWithdrawal <= 0) return input
  const retirementDurationYears = input.lifeExpectancy - input.retirementAge
  const lastYearWithdrawal = (rate: number) => input.desiredMonthlyWithdrawal * Math.pow(1 + rate / 100, retirementDurationYears - 1)
  let inflationRate = input.inflationRate
  while (inflationRate > 0 && (!Number.isFinite(lastYearWithdrawal(inflationRate)) || lastYearWithdrawal(inflationRate) > Number.MAX_SAFE_INTEGER)) {
    inflationRate = inflationRate / 2 < 0.01 ? 0 : inflationRate / 2
  }
  return inflationRate === input.inflationRate ? input : { ...input, inflationRate }
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. Also
 * enforces the two cross-field orderings validateRetirementInput requires (retirement after current
 * age, life expectancy after retirement) by nudging the later age forward rather than rejecting —
 * none of this batch's other calculators have a relational constraint across two continuous slider
 * fields, so unlike the ForSafety clamps above (which mirror an existing schema check) this ordering
 * fix-up is new to Retirement Corpus. */
function toLiveInput(values: RetirementFormValues): RetirementInput {
  const currentAge = Math.round(clampFinite(Number(values.currentAge), RETIREMENT_DEFAULT_INPUT.currentAge, RETIREMENT_LIMITS.currentAge.min, RETIREMENT_LIMITS.currentAge.max))
  const rawRetirementAge = Math.round(clampFinite(Number(values.retirementAge), RETIREMENT_DEFAULT_INPUT.retirementAge, RETIREMENT_LIMITS.retirementAge.min, RETIREMENT_LIMITS.retirementAge.max))
  const retirementAge = Math.min(RETIREMENT_LIMITS.retirementAge.max, Math.max(rawRetirementAge, currentAge + 1))
  const rawLifeExpectancy = Math.round(clampFinite(Number(values.lifeExpectancy), RETIREMENT_DEFAULT_INPUT.lifeExpectancy, RETIREMENT_LIMITS.lifeExpectancy.min, RETIREMENT_LIMITS.lifeExpectancy.max))
  const lifeExpectancy = Math.min(RETIREMENT_LIMITS.lifeExpectancy.max, Math.max(rawLifeExpectancy, retirementAge + 1))

  const withOrderedAges: RetirementInput = {
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentSavings: clampFinite(Number(values.currentSavings), RETIREMENT_DEFAULT_INPUT.currentSavings, RETIREMENT_LIMITS.currentSavings.min, RETIREMENT_LIMITS.currentSavings.max),
    monthlyContribution: clampFinite(Number(values.monthlyContribution), RETIREMENT_DEFAULT_INPUT.monthlyContribution, RETIREMENT_LIMITS.monthlyContribution.min, RETIREMENT_LIMITS.monthlyContribution.max),
    expectedReturnPreRetirement: clampFinite(Number(values.expectedReturnPreRetirement), RETIREMENT_DEFAULT_INPUT.expectedReturnPreRetirement, RETIREMENT_LIMITS.expectedReturnPreRetirement.min, RETIREMENT_LIMITS.expectedReturnPreRetirement.max),
    expectedReturnPostRetirement: clampFinite(Number(values.expectedReturnPostRetirement), RETIREMENT_DEFAULT_INPUT.expectedReturnPostRetirement, RETIREMENT_LIMITS.expectedReturnPostRetirement.min, RETIREMENT_LIMITS.expectedReturnPostRetirement.max),
    desiredMonthlyWithdrawal: clampFinite(Number(values.desiredMonthlyWithdrawal), RETIREMENT_DEFAULT_INPUT.desiredMonthlyWithdrawal, RETIREMENT_LIMITS.desiredMonthlyWithdrawal.min, RETIREMENT_LIMITS.desiredMonthlyWithdrawal.max),
    inflationRate: clampFinite(Number(values.inflationRate), RETIREMENT_DEFAULT_INPUT.inflationRate, RETIREMENT_LIMITS.inflationRate.min, RETIREMENT_LIMITS.inflationRate.max),
  }
  return clampWithdrawalForSafety(clampPreRetirementForSafety(withOrderedAges))
}

function toChartPoints(input: RetirementInput, result: RetirementResult): { readonly points: readonly TwoPhaseChartPoint[]; readonly retirementIndex: number } {
  const start: TwoPhaseChartPoint = { label: `Age ${input.currentAge}`, balance: input.currentSavings }
  const accumulation = result.accumulationSchedule.map((row) => ({ label: `Age ${row.age}`, balance: row.yearEndBalance }))
  const decumulation = result.decumulationSchedule.map((row) => ({ label: `Age ${row.age}`, balance: row.closingBalance }))
  return { points: [start, ...accumulation, ...decumulation], retirementIndex: accumulation.length }
}

function toMilestoneItems(input: RetirementInput, result: RetirementResult): readonly MilestoneItem[] {
  const accSchedule = result.accumulationSchedule
  const decSchedule = result.decumulationSchedule
  const accPicks = pickMilestoneIndices(accSchedule.length)
  const midAccIndex = accPicks[Math.floor(accPicks.length / 2)]
  const decPicks = pickMilestoneIndices(decSchedule.length)
  const midDecIndex = decPicks[Math.floor(decPicks.length / 2)]

  const outcome: MilestoneItem = result.isExhausted
    ? { label: `Exhausted, age ${result.exhaustionAge}`, value: formatIndianCurrency(0), highlight: true }
    : { label: `Age ${input.lifeExpectancy}`, value: formatIndianCurrency(result.remainingBalanceAtLifeExpectancy), highlight: true }

  return [
    { label: `Age ${accSchedule[midAccIndex].age}`, value: formatIndianCurrency(accSchedule[midAccIndex].yearEndBalance) },
    { label: "Retirement", value: formatIndianCurrency(result.corpusAtRetirement), highlight: true },
    { label: `Age ${decSchedule[midDecIndex].age}`, value: formatIndianCurrency(decSchedule[midDecIndex].closingBalance) },
    outcome,
  ]
}

/** gainToDate and cumulativeInvestment are cumulative to date — contributionThisYear is already
 * incremental, so only gainToDate needs a year-over-year delta for the "growth this year" series. */
function toAccumulationChartData(schedule: readonly RetirementAccumulationScheduleRow[]) {
  let previousGain = 0
  const labels: string[] = []
  const contribution: number[] = []
  const growth: number[] = []
  for (const row of schedule) {
    labels.push(`Age ${row.age}`)
    contribution.push(Math.round(row.contributionThisYear))
    growth.push(Math.round(row.gainToDate - previousGain))
    previousGain = row.gainToDate
  }
  return { labels, contribution, growth }
}

export type RetirementResultPhase = "accumulation" | "decumulation"

type PhaseDonutItem = {
  readonly label: string
  readonly value: number
  readonly formattedValue: string
  readonly colorClass: string
  readonly ringClass?: string
}

type PhaseStatCell = { readonly label: string; readonly value: string }

export type RetirementPhaseView = {
  readonly donutTitle: string
  readonly donutItems: readonly [PhaseDonutItem, PhaseDonutItem]
  readonly statCells: readonly [PhaseStatCell, PhaseStatCell, PhaseStatCell, PhaseStatCell]
}

/** Pure mapping from the above-the-fold phase toggle to the donut + stat-grid content it drives, so
 * the default phase, the swap, and each phase's field mapping are unit-testable without rendering.
 * "accumulation"'s donut reproduces exactly what it showed before this toggle existed; its stat grid
 * does not — the old grid mixed 2 accumulation cells (Corpus at retirement, Total contributions) with
 * 2 decumulation cells (First-year/Final monthly withdrawal) and is now fully accumulation-scoped,
 * adding two cells that weren't in the old grid at all (Total growth at retirement, Years to
 * retirement). "decumulation" is the first caller of totalWithdrawn/totalGrowthInRetirement, which
 * Sprint 56 found were computed but never referenced anywhere in this component. */
export function toRetirementPhaseView(phase: RetirementResultPhase, result: RetirementResult): RetirementPhaseView {
  if (phase === "decumulation") {
    return {
      donutTitle: "Withdrawn vs growth during retirement",
      donutItems: [
        { label: "Withdrawn", value: result.totalWithdrawn, formattedValue: formatIndianCurrency(result.totalWithdrawn), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
        { label: "Growth", value: result.totalGrowthInRetirement, formattedValue: formatIndianCurrency(result.totalGrowthInRetirement), colorClass: "bg-gold", ringClass: "stroke-gold" },
      ],
      statCells: [
        { label: "First-year monthly withdrawal", value: formatIndianCurrency(result.firstYearMonthlyWithdrawal) },
        { label: "Final monthly withdrawal", value: formatIndianCurrency(result.finalMonthlyWithdrawal) },
        { label: "Total withdrawn", value: formatIndianCurrency(result.totalWithdrawn) },
        { label: "Total growth in retirement", value: formatIndianCurrency(result.totalGrowthInRetirement) },
      ],
    }
  }
  return {
    donutTitle: "Contributions vs growth at retirement",
    donutItems: [
      { label: "Contributions", value: result.totalContributions, formattedValue: formatIndianCurrency(result.totalContributions), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
      { label: "Growth", value: result.totalGainAtRetirement, formattedValue: formatIndianCurrency(result.totalGainAtRetirement), colorClass: "bg-gold", ringClass: "stroke-gold" },
    ],
    statCells: [
      { label: "Corpus at retirement", value: formatIndianCurrency(result.corpusAtRetirement) },
      { label: "Total contributions", value: formatIndianCurrency(result.totalContributions) },
      { label: "Total growth at retirement", value: formatIndianCurrency(result.totalGainAtRetirement) },
      { label: "Years to retirement", value: `${result.yearsToRetirement} years` },
    ],
  }
}

const accumulationColumns: readonly DataTableColumn<RetirementAccumulationScheduleRow>[] = [
  { header: "Age", cell: (row) => row.age },
  { header: "Contribution this year", cell: (row) => formatIndianCurrency(row.contributionThisYear) },
  { header: "Cumulative investment", cell: (row) => formatIndianCurrency(row.cumulativeInvestment) },
  { header: "Year-end balance", cell: (row) => formatIndianCurrency(row.yearEndBalance) },
  { header: "Gain to date", cell: (row) => formatIndianCurrency(row.gainToDate) },
]

const decumulationColumns: readonly DataTableColumn<RetirementDecumulationScheduleRow>[] = [
  { header: "Age", cell: (row) => row.age },
  { header: "Opening balance", cell: (row) => formatIndianCurrency(row.openingBalance) },
  { header: "Monthly withdrawal this year", cell: (row) => formatIndianCurrency(row.monthlyWithdrawalThisYear) },
  { header: "Withdrawals in year", cell: (row) => formatIndianCurrency(row.withdrawalsInYear) },
  { header: "Growth in year", cell: (row) => formatIndianCurrency(row.growthInYear) },
  { header: "Closing balance", cell: (row) => (row.isExhaustionYear ? `${formatIndianCurrency(row.closingBalance)} (exhausted)` : formatIndianCurrency(row.closingBalance)) },
]

export function RetirementCalculator() {
  const [values, setValues] = useState<RetirementFormValues>(() => toFormValues(RETIREMENT_DEFAULT_INPUT))
  const [errors, setErrors] = useState<RetirementValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")
  // Default is "accumulation" so page load matches today's existing above-the-fold view unchanged.
  const [phase, setPhase] = useState<RetirementResultPhase>("accumulation")
  // Tracks whether the user has deliberately changed the post-retirement return away from the
  // pre-retirement return. Until they do, changing the pre-retirement field also updates the
  // post-retirement field, so the single-rate case (decision 2 in calculate-retirement.ts) never
  // requires the user to fill in a second field by hand.
  const [postReturnTouched, setPostReturnTouched] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    const input = parseRetirementUrlState(search)
    setValues(toFormValues(input))
    setPostReturnTouched(input.expectedReturnPostRetirement !== input.expectedReturnPreRetirement)
  })

  function updateValue(field: keyof RetirementFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    if (field === "expectedReturnPreRetirement" && !postReturnTouched) nextValues.expectedReturnPostRetirement = value
    setValues(nextValues)
    if (field === "expectedReturnPostRetirement") setPostReturnTouched(true)
    const validation = parseAndValidateRetirementForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildRetirementCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(RETIREMENT_DEFAULT_INPUT))
    setPostReturnTouched(false)
    setErrors({})
    window.history.replaceState(null, "", "/finance/retirement-corpus-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateRetirement(liveInput), [liveInput])
  useTrackCalculationCompleted("retirement-corpus", "investments", result)
  const phaseView = useMemo(() => toRetirementPhaseView(phase, result), [phase, result])
  const chart = useMemo(() => toChartPoints(liveInput, result), [liveInput, result])
  const milestoneItems = useMemo(() => toMilestoneItems(liveInput, result), [liveInput, result])
  const retirementDurationYears = liveInput.lifeExpectancy - liveInput.retirementAge

  const accumulationChartData = useMemo(() => toAccumulationChartData(result.accumulationSchedule), [result.accumulationSchedule])
  const accumulationChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Contribution", values: accumulationChartData.contribution, colorVar: "--cat-invest" },
    { label: "Growth", values: accumulationChartData.growth, colorVar: "--gold" },
  ], [accumulationChartData])

  const decumulationChartLabels = useMemo(() => result.decumulationSchedule.map((row) => `Age ${row.age}`), [result.decumulationSchedule])
  const decumulationChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Withdrawals", values: result.decumulationSchedule.map((row) => Math.round(row.withdrawalsInYear)), colorVar: "--cat-invest" },
    { label: "Growth", values: result.decumulationSchedule.map((row) => Math.round(row.growthInYear)), colorVar: "--gold" },
  ], [result.decumulationSchedule])

  const primaryLabel = result.isExhausted ? "Corpus exhausted at age" : "Remaining balance at life expectancy"
  const primaryValue = result.isExhausted ? `Age ${result.exhaustionAge}` : formatIndianCurrency(result.remainingBalanceAtLifeExpectancy)
  const subtitle = `from ${formatIndianCurrency(result.corpusAtRetirement)} at retirement (age ${liveInput.retirementAge}), over ${retirementDurationYears} years of retirement`

  const shareUrl = buildRetirementCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator Retirement Corpus Estimate", "",
    `Current age / retirement age / life expectancy: ${liveInput.currentAge} / ${liveInput.retirementAge} / ${liveInput.lifeExpectancy}`,
    `Current savings: ${formatIndianCurrency(liveInput.currentSavings)}`,
    `Monthly contribution: ${formatIndianCurrency(liveInput.monthlyContribution)}`,
    `Expected return before / during retirement: ${formatPercentage(liveInput.expectedReturnPreRetirement)} / ${formatPercentage(liveInput.expectedReturnPostRetirement)}`,
    `Desired monthly withdrawal (today's money): ${formatIndianCurrency(liveInput.desiredMonthlyWithdrawal)}`,
    `Assumed annual inflation: ${formatPercentage(liveInput.inflationRate)}`,
    `Corpus at retirement: ${formatIndianCurrency(result.corpusAtRetirement)}`,
    `Total contributions: ${formatIndianCurrency(result.totalContributions)}`,
    result.isExhausted ? `Corpus exhausted at age ${result.exhaustionAge}` : `Remaining balance at life expectancy: ${formatIndianCurrency(result.remainingBalanceAtLifeExpectancy)}`,
    "This is an illustrative projection based on constant assumed rates, not a retirement plan. It excludes sequence-of-returns risk, healthcare costs, taxation, and government pension income.",
    "", "Calculator:", `${siteConfig.url}/finance/retirement-corpus-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Retirement details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                <fieldset className="space-y-5">
                  <legend className="text-base font-semibold">Accumulation phase (until retirement)</legend>
                  <PairedNumberSliderInput
                    id="current-age"
                    label="Current age"
                    suffix="years"
                    min={RETIREMENT_LIMITS.currentAge.min}
                    max={RETIREMENT_LIMITS.currentAge.max}
                    step={1}
                    value={values.currentAge}
                    sliderValue={liveInput.currentAge}
                    onValueChange={(value) => updateValue("currentAge", value)}
                    error={errors.currentAge}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="retirement-age"
                    label="Retirement age"
                    suffix="years"
                    min={RETIREMENT_LIMITS.retirementAge.min}
                    max={RETIREMENT_LIMITS.retirementAge.max}
                    step={1}
                    value={values.retirementAge}
                    sliderValue={liveInput.retirementAge}
                    onValueChange={(value) => updateValue("retirementAge", value)}
                    error={errors.retirementAge}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="current-savings"
                    label="Current savings"
                    prefix="₹"
                    min={RETIREMENT_LIMITS.currentSavings.min}
                    max={RETIREMENT_LIMITS.currentSavings.max}
                    step={10_000}
                    sliderMin={0}
                    sliderMax={10_000_000}
                    value={values.currentSavings}
                    sliderValue={liveInput.currentSavings}
                    onValueChange={(value) => updateValue("currentSavings", value)}
                    error={errors.currentSavings}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="monthly-contribution"
                    label="Monthly contribution"
                    prefix="₹"
                    min={RETIREMENT_LIMITS.monthlyContribution.min}
                    max={RETIREMENT_LIMITS.monthlyContribution.max}
                    step={500}
                    sliderMin={0}
                    sliderMax={200_000}
                    value={values.monthlyContribution}
                    sliderValue={liveInput.monthlyContribution}
                    onValueChange={(value) => updateValue("monthlyContribution", value)}
                    error={errors.monthlyContribution}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="pre-return"
                    label="Expected annual return before retirement"
                    description="A constant modelling assumption for this scenario, not a forecast or guaranteed return."
                    suffix="%"
                    min={RETIREMENT_LIMITS.expectedReturnPreRetirement.min}
                    max={RETIREMENT_LIMITS.expectedReturnPreRetirement.max}
                    step={0.1}
                    sliderMin={0}
                    sliderMax={20}
                    value={values.expectedReturnPreRetirement}
                    sliderValue={liveInput.expectedReturnPreRetirement}
                    onValueChange={(value) => updateValue("expectedReturnPreRetirement", value)}
                    error={errors.expectedReturnPreRetirement}
                    required
                    accentClassName="accent-cat-invest"
                  />
                </fieldset>
                <fieldset className="space-y-5 border-t pt-6">
                  <legend className="text-base font-semibold">Retirement phase (from retirement to life expectancy)</legend>
                  <PairedNumberSliderInput
                    id="life-expectancy"
                    label="Life expectancy"
                    suffix="years"
                    min={RETIREMENT_LIMITS.lifeExpectancy.min}
                    max={RETIREMENT_LIMITS.lifeExpectancy.max}
                    step={1}
                    value={values.lifeExpectancy}
                    sliderValue={liveInput.lifeExpectancy}
                    onValueChange={(value) => updateValue("lifeExpectancy", value)}
                    error={errors.lifeExpectancy}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="post-return"
                    label="Expected annual return during retirement"
                    description="Starts equal to the pre-retirement return; lower it for a more conservative post-retirement allocation."
                    suffix="%"
                    min={RETIREMENT_LIMITS.expectedReturnPostRetirement.min}
                    max={RETIREMENT_LIMITS.expectedReturnPostRetirement.max}
                    step={0.1}
                    sliderMin={0}
                    sliderMax={20}
                    value={values.expectedReturnPostRetirement}
                    sliderValue={liveInput.expectedReturnPostRetirement}
                    onValueChange={(value) => updateValue("expectedReturnPostRetirement", value)}
                    error={errors.expectedReturnPostRetirement}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="withdrawal"
                    label="Desired monthly withdrawal (today's money)"
                    description="The nominal (actual rupee) monthly withdrawal grows with assumed inflation each year of retirement."
                    prefix="₹"
                    min={RETIREMENT_LIMITS.desiredMonthlyWithdrawal.min}
                    max={RETIREMENT_LIMITS.desiredMonthlyWithdrawal.max}
                    step={1_000}
                    sliderMin={100}
                    sliderMax={500_000}
                    value={values.desiredMonthlyWithdrawal}
                    sliderValue={liveInput.desiredMonthlyWithdrawal}
                    onValueChange={(value) => updateValue("desiredMonthlyWithdrawal", value)}
                    error={errors.desiredMonthlyWithdrawal}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="inflation"
                    label="Assumed annual inflation rate"
                    description="A negative value models deflation."
                    suffix="%"
                    min={RETIREMENT_LIMITS.inflationRate.min}
                    max={RETIREMENT_LIMITS.inflationRate.max}
                    step={0.1}
                    value={values.inflationRate}
                    sliderValue={liveInput.inflationRate}
                    onValueChange={(value) => updateValue("inflationRate", value)}
                    error={errors.inflationRate}
                    required
                    accentClassName="accent-cat-invest"
                  />
                </fieldset>
                <Button type="button" size="lg" variant="outline" className="w-full" onClick={handleReset}>Reset</Button>
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

            <div className="mt-5 flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Show figures for</h3>
              <div role="group" aria-label="Retirement phase" className="inline-flex gap-1.5">
                <Button type="button" size="sm" variant={phase === "accumulation" ? "default" : "outline"} aria-pressed={phase === "accumulation"} onClick={() => setPhase("accumulation")}>At retirement</Button>
                <Button type="button" size="sm" variant={phase === "decumulation" ? "default" : "outline"} aria-pressed={phase === "decumulation"} onClick={() => setPhase("decumulation")}>During retirement</Button>
              </div>
            </div>

            <div className="mt-3" aria-live="polite">
              <div className="grid grid-cols-2 gap-3">
                {phaseView.statCells.map((cell) => (
                  <div key={cell.label} className="rounded-lg border border-line bg-card p-3.5">
                    <p className="mb-1 text-xs text-muted-foreground">{cell.label}</p>
                    <p className="font-mono text-lg font-semibold">{cell.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <SimpleDonutChart title={phaseView.donutTitle} items={phaseView.donutItems} />
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="retirement-corpus" category="investments" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="retirement-accumulation-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Accumulation breakdown</p>
        <h2 id="retirement-accumulation-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Contribution vs growth, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s contribution to the corpus before retirement, split by what was contributed vs. growth earned that year.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={accumulationChartData.labels}
            series={accumulationChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of contribution versus growth for each year of the accumulation phase"
          />
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="retirement-decumulation-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Withdrawal breakdown</p>
        <h2 id="retirement-decumulation-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Withdrawals vs growth, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s change in the corpus during retirement, split by what was withdrawn vs. growth earned that year.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={decumulationChartLabels}
            series={decumulationChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of withdrawals versus growth for each year of the retirement drawdown phase"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Corpus over time" description="The accumulation phase compounds savings and contributions to retirement; the withdrawal phase then draws the corpus down at an inflation-adjusted rate.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View tables" : "View chart"}</Button>
          </div>
          <div className="mt-4">
            {scheduleView === "chart" ? (
              <>
                <TwoPhaseChart points={chart.points} retirementIndex={chart.retirementIndex} balanceLabel="Corpus" />
                <MilestoneRow items={milestoneItems} />
              </>
            ) : (
              <div className="space-y-10">
                <div>
                  <h3 className="text-lg font-semibold">Accumulation schedule</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Each year&apos;s contribution is added before that year&apos;s growth is applied.</p>
                  <div className="mt-4"><DataTable caption="Retirement Corpus accumulation-phase yearly schedule, from current age to retirement age" rows={result.accumulationSchedule} columns={accumulationColumns} initialRows={15} /></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Retirement withdrawal schedule</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Each year&apos;s withdrawals are taken before that year&apos;s growth is applied to the remaining balance, and the monthly withdrawal amount grows with assumed inflation each year.</p>
                  <div className="mt-4"><DataTable caption="Retirement Corpus retirement-phase yearly withdrawal schedule, from retirement age to life expectancy" rows={result.decumulationSchedule} columns={decumulationColumns} initialRows={15} /></div>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed currency is rounded to two decimal places; calculations retain full precision.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
