"use client"

import { useMemo, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { MilestoneRow, pickMilestoneIndices, TwoPhaseChart, type MilestoneItem, type TwoPhaseChartPoint } from "@/components/calculators/growth-area-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
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
    setValues((current) => {
      const next = { ...current, [field]: value }
      if (field === "expectedReturnPreRetirement" && !postReturnTouched) next.expectedReturnPostRetirement = value
      return next
    })
    if (field === "expectedReturnPostRetirement") setPostReturnTouched(true)
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === "expectedReturnPreRetirement" && !postReturnTouched ? { expectedReturnPostRetirement: undefined } : {}) }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateRetirementForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildRetirementCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(RETIREMENT_DEFAULT_INPUT))
    setPostReturnTouched(false)
    setErrors({})
    window.history.replaceState(null, "", "/finance/retirement-corpus-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateRetirement(liveInput), [liveInput])
  const chart = useMemo(() => toChartPoints(liveInput, result), [liveInput, result])
  const milestoneItems = useMemo(() => toMilestoneItems(liveInput, result), [liveInput, result])
  const retirementDurationYears = liveInput.lifeExpectancy - liveInput.retirementAge

  const primaryLabel = result.isExhausted ? "Corpus exhausted at age" : "Remaining balance at life expectancy"
  const primaryValue = result.isExhausted ? `Age ${result.exhaustionAge}` : formatIndianCurrency(result.remainingBalanceAtLifeExpectancy)
  const subtitle = `from ${formatIndianCurrency(result.corpusAtRetirement)} at retirement (age ${liveInput.retirementAge}), over ${retirementDurationYears} years of retirement`

  const shareUrl = buildRetirementCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
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
              <form className="space-y-8" onSubmit={handleSubmit} noValidate>
                <fieldset className="space-y-5">
                  <legend className="text-base font-semibold">Accumulation phase (until retirement)</legend>
                  <div>
                    <CalculatorNumberInput id="current-age" label="Current age" suffix="years" min={RETIREMENT_LIMITS.currentAge.min} max={RETIREMENT_LIMITS.currentAge.max} step={1} value={values.currentAge} onValueChange={(value) => updateValue("currentAge", value)} error={errors.currentAge} required />
                    <input type="range" aria-label="Current age slider" min={RETIREMENT_LIMITS.currentAge.min} max={RETIREMENT_LIMITS.currentAge.max} step={1} value={liveInput.currentAge} onChange={(event) => updateValue("currentAge", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="retirement-age" label="Retirement age" suffix="years" min={RETIREMENT_LIMITS.retirementAge.min} max={RETIREMENT_LIMITS.retirementAge.max} step={1} value={values.retirementAge} onValueChange={(value) => updateValue("retirementAge", value)} error={errors.retirementAge} required />
                    <input type="range" aria-label="Retirement age slider" min={RETIREMENT_LIMITS.retirementAge.min} max={RETIREMENT_LIMITS.retirementAge.max} step={1} value={liveInput.retirementAge} onChange={(event) => updateValue("retirementAge", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="current-savings" label="Current savings" prefix="₹" min={RETIREMENT_LIMITS.currentSavings.min} max={RETIREMENT_LIMITS.currentSavings.max} step={10_000} value={values.currentSavings} onValueChange={(value) => updateValue("currentSavings", value)} error={errors.currentSavings} required />
                    <input type="range" aria-label="Current savings slider" min={0} max={10_000_000} step={10_000} value={liveInput.currentSavings} onChange={(event) => updateValue("currentSavings", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="monthly-contribution" label="Monthly contribution" prefix="₹" min={RETIREMENT_LIMITS.monthlyContribution.min} max={RETIREMENT_LIMITS.monthlyContribution.max} step={500} value={values.monthlyContribution} onValueChange={(value) => updateValue("monthlyContribution", value)} error={errors.monthlyContribution} required />
                    <input type="range" aria-label="Monthly contribution slider" min={0} max={200_000} step={500} value={liveInput.monthlyContribution} onChange={(event) => updateValue("monthlyContribution", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="pre-return" label="Expected annual return before retirement" description="A constant modelling assumption for this scenario, not a forecast or guaranteed return." suffix="%" min={RETIREMENT_LIMITS.expectedReturnPreRetirement.min} max={RETIREMENT_LIMITS.expectedReturnPreRetirement.max} step={0.1} value={values.expectedReturnPreRetirement} onValueChange={(value) => updateValue("expectedReturnPreRetirement", value)} error={errors.expectedReturnPreRetirement} required />
                    <input type="range" aria-label="Expected annual return before retirement slider" min={0} max={20} step={0.1} value={liveInput.expectedReturnPreRetirement} onChange={(event) => updateValue("expectedReturnPreRetirement", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                </fieldset>
                <fieldset className="space-y-5 border-t pt-6">
                  <legend className="text-base font-semibold">Retirement phase (from retirement to life expectancy)</legend>
                  <div>
                    <CalculatorNumberInput id="life-expectancy" label="Life expectancy" suffix="years" min={RETIREMENT_LIMITS.lifeExpectancy.min} max={RETIREMENT_LIMITS.lifeExpectancy.max} step={1} value={values.lifeExpectancy} onValueChange={(value) => updateValue("lifeExpectancy", value)} error={errors.lifeExpectancy} required />
                    <input type="range" aria-label="Life expectancy slider" min={RETIREMENT_LIMITS.lifeExpectancy.min} max={RETIREMENT_LIMITS.lifeExpectancy.max} step={1} value={liveInput.lifeExpectancy} onChange={(event) => updateValue("lifeExpectancy", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="post-return" label="Expected annual return during retirement" description="Starts equal to the pre-retirement return; lower it for a more conservative post-retirement allocation." suffix="%" min={RETIREMENT_LIMITS.expectedReturnPostRetirement.min} max={RETIREMENT_LIMITS.expectedReturnPostRetirement.max} step={0.1} value={values.expectedReturnPostRetirement} onValueChange={(value) => updateValue("expectedReturnPostRetirement", value)} error={errors.expectedReturnPostRetirement} required />
                    <input type="range" aria-label="Expected annual return during retirement slider" min={0} max={20} step={0.1} value={liveInput.expectedReturnPostRetirement} onChange={(event) => updateValue("expectedReturnPostRetirement", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="withdrawal" label="Desired monthly withdrawal (today's money)" description="The nominal (actual rupee) monthly withdrawal grows with assumed inflation each year of retirement." prefix="₹" min={RETIREMENT_LIMITS.desiredMonthlyWithdrawal.min} max={RETIREMENT_LIMITS.desiredMonthlyWithdrawal.max} step={1_000} value={values.desiredMonthlyWithdrawal} onValueChange={(value) => updateValue("desiredMonthlyWithdrawal", value)} error={errors.desiredMonthlyWithdrawal} required />
                    <input type="range" aria-label="Desired monthly withdrawal slider" min={100} max={500_000} step={1_000} value={liveInput.desiredMonthlyWithdrawal} onChange={(event) => updateValue("desiredMonthlyWithdrawal", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                  <div>
                    <CalculatorNumberInput id="inflation" label="Assumed annual inflation rate" description="A negative value models deflation." suffix="%" min={RETIREMENT_LIMITS.inflationRate.min} max={RETIREMENT_LIMITS.inflationRate.max} step={0.1} value={values.inflationRate} onValueChange={(value) => updateValue("inflationRate", value)} error={errors.inflationRate} required />
                    <input type="range" aria-label="Assumed annual inflation rate slider" min={RETIREMENT_LIMITS.inflationRate.min} max={RETIREMENT_LIMITS.inflationRate.max} step={0.1} value={liveInput.inflationRate} onChange={(event) => updateValue("inflationRate", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                </fieldset>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" size="lg" className="flex-1">Calculate retirement corpus</Button>
                  <Button type="button" size="lg" variant="outline" className="flex-1" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">{primaryLabel}</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{primaryValue}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">{subtitle}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Corpus at retirement</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.corpusAtRetirement)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total contributions</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalContributions)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">First-year monthly withdrawal</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.firstYearMonthlyWithdrawal)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Final monthly withdrawal</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.finalMonthlyWithdrawal)}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator Retirement Corpus Estimate"
          calculationDate={calculationDate}
          disclaimer="This is an illustrative projection based on constant assumed rates, not a retirement plan. It excludes sequence-of-returns risk, healthcare costs, taxation, and government pension income."
          items={[
            { label: "Current age / retirement age / life expectancy", value: `${liveInput.currentAge} / ${liveInput.retirementAge} / ${liveInput.lifeExpectancy}` },
            { label: "Current savings", value: formatIndianCurrency(liveInput.currentSavings) },
            { label: "Monthly contribution", value: formatIndianCurrency(liveInput.monthlyContribution) },
            { label: "Expected return before / during retirement", value: `${formatPercentage(liveInput.expectedReturnPreRetirement)} / ${formatPercentage(liveInput.expectedReturnPostRetirement)}` },
            { label: "Desired monthly withdrawal (today's money)", value: formatIndianCurrency(liveInput.desiredMonthlyWithdrawal) },
            { label: "Assumed annual inflation", value: formatPercentage(liveInput.inflationRate) },
            { label: "Corpus at retirement", value: formatIndianCurrency(result.corpusAtRetirement) },
            { label: "Total contributions", value: formatIndianCurrency(result.totalContributions) },
            { label: "Retirement outcome", value: result.isExhausted ? `Corpus exhausted at age ${result.exhaustionAge}` : `Remaining balance at life expectancy: ${formatIndianCurrency(result.remainingBalanceAtLifeExpectancy)}` },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="retirement-schedule-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Corpus over time</p>
            <h2 id="retirement-schedule-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">How your corpus grows, then draws down</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">The accumulation phase compounds savings and contributions to retirement; the withdrawal phase then draws the corpus down at an inflation-adjusted rate.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View tables" : "View chart"}</Button>
        </div>
        <div className="mt-6">
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
      </section>
    </div>
  )
}
