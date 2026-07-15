"use client"
import { useEffect, useState, type FormEvent } from "react"
import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard, CalculatorShell } from "@/features/calculators/core"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { CalculatorResultItem } from "@/types/calculator"
import { calculateRetirement } from "./calculate-retirement"
import { parseAndValidateRetirementForm, RETIREMENT_LIMITS, type RetirementFormValues } from "./retirement-schema"
import type { RetirementAccumulationScheduleRow, RetirementDecumulationScheduleRow, RetirementInput, RetirementResult, RetirementValidationErrors } from "./retirement-types"
import { buildRetirementCalculatorUrl, parseRetirementUrlState, parseValidRetirementUrlState, RETIREMENT_DEFAULT_INPUT } from "./retirement-url-state"

const toForm = (input: RetirementInput): RetirementFormValues => ({
  currentAge: String(input.currentAge),
  retirementAge: String(input.retirementAge),
  lifeExpectancy: String(input.lifeExpectancy),
  currentSavings: String(input.currentSavings),
  monthlyContribution: String(input.monthlyContribution),
  expectedReturnPreRetirement: String(input.expectedReturnPreRetirement),
  expectedReturnPostRetirement: String(input.expectedReturnPostRetirement),
  desiredMonthlyWithdrawal: String(input.desiredMonthlyWithdrawal),
  inflationRate: String(input.inflationRate),
})

function resultItems(result: RetirementResult): readonly CalculatorResultItem[] {
  const retirementOutcome: CalculatorResultItem = result.isExhausted
    ? { id: "exhaustion", label: "Corpus exhausted at age", value: String(result.exhaustionAge), displayType: "text", isPrimary: true }
    : { id: "remaining", label: "Remaining balance at life expectancy", value: result.remainingBalanceAtLifeExpectancy, displayType: "currency", isPrimary: true }
  return [
    { id: "corpus", label: "Corpus at retirement", value: result.corpusAtRetirement, displayType: "currency" },
    { id: "contributions", label: "Total contributions", value: result.totalContributions, displayType: "currency" },
    { id: "gain", label: "Estimated gain at retirement", value: result.totalGainAtRetirement, displayType: "currency" },
    retirementOutcome,
    { id: "first-withdrawal", label: "First-year monthly withdrawal", value: result.firstYearMonthlyWithdrawal, displayType: "currency" },
    { id: "final-withdrawal", label: "Final monthly withdrawal", value: result.finalMonthlyWithdrawal, displayType: "currency" },
    { id: "duration", label: "Corpus lasted the full retirement duration", value: result.corpusLastsFullDuration ? "Yes" : "No", displayType: "text" },
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
  const [values, setValues] = useState(() => toForm(RETIREMENT_DEFAULT_INPUT))
  const [errors, setErrors] = useState<RetirementValidationErrors>({})
  const [calculation, setCalculation] = useState<{ input: RetirementInput; result: RetirementResult; date: string } | null>(null)
  // Tracks whether the user has deliberately changed the post-retirement return away from the
  // pre-retirement return. Until they do, changing the pre-retirement field also updates the
  // post-retirement field, so the single-rate case (decision 2 in calculate-retirement.ts) never
  // requires the user to fill in a second field by hand.
  const [postReturnTouched, setPostReturnTouched] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const search = new URLSearchParams(location.search)
      const input = parseRetirementUrlState(search)
      const shared = parseValidRetirementUrlState(search)
      setValues(toForm(input))
      setPostReturnTouched(input.expectedReturnPostRetirement !== input.expectedReturnPreRetirement)
      if (shared) setCalculation({ input: shared, result: calculateRetirement(shared), date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  function update(field: keyof RetirementFormValues, value: string) {
    setValues((current) => {
      const next = { ...current, [field]: value }
      if (field === "expectedReturnPreRetirement" && !postReturnTouched) next.expectedReturnPostRetirement = value
      return next
    })
    if (field === "expectedReturnPostRetirement") setPostReturnTouched(true)
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === "expectedReturnPreRetirement" && !postReturnTouched ? { expectedReturnPostRetirement: undefined } : {}) }))
    setCalculation(null)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const validation = parseAndValidateRetirementForm(values)
    if (!validation.success) { setErrors(validation.errors); setCalculation(null); return }
    const result = calculateRetirement(validation.data)
    setErrors({})
    setCalculation({ input: validation.data, result, date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    history.replaceState(null, "", buildRetirementCalculatorUrl(validation.data))
  }

  function reset() {
    setValues(toForm(RETIREMENT_DEFAULT_INPUT))
    setPostReturnTouched(false)
    setErrors({})
    setCalculation(null)
    history.replaceState(null, "", "/finance/retirement-corpus-calculator")
  }

  const copiedText = calculation ? [
    "ThinkCalculator Retirement Corpus Estimate",
    `Current age / retirement age / life expectancy: ${calculation.input.currentAge} / ${calculation.input.retirementAge} / ${calculation.input.lifeExpectancy}`,
    `Current savings: ${formatIndianCurrency(calculation.input.currentSavings)}`,
    `Monthly contribution: ${formatIndianCurrency(calculation.input.monthlyContribution)}`,
    `Expected return before / during retirement: ${formatPercentage(calculation.input.expectedReturnPreRetirement)} / ${formatPercentage(calculation.input.expectedReturnPostRetirement)}`,
    `Desired monthly withdrawal (today's money): ${formatIndianCurrency(calculation.input.desiredMonthlyWithdrawal)}`,
    `Assumed annual inflation: ${formatPercentage(calculation.input.inflationRate)}`,
    `Corpus at retirement: ${formatIndianCurrency(calculation.result.corpusAtRetirement)}`,
    `Total contributions: ${formatIndianCurrency(calculation.result.totalContributions)}`,
    calculation.result.isExhausted ? `Corpus exhausted at age ${calculation.result.exhaustionAge}` : `Remaining balance at life expectancy: ${formatIndianCurrency(calculation.result.remainingBalanceAtLifeExpectancy)}`,
    "This is an illustrative projection based on constant assumed rates, not a retirement plan. It excludes sequence-of-returns risk, healthcare costs, taxation, and government pension income.",
  ].join("\n") : ""

  return <>
    <div data-calculator-form>
      <CalculatorShell title="Project a retirement corpus" description="Combine savings and contributions into a projected corpus, then see how an inflation-adjusted withdrawal draws it down.">
        <form className="space-y-8" onSubmit={submit} noValidate>
          <fieldset className="space-y-5">
            <legend className="text-base font-semibold">Accumulation phase (until retirement)</legend>
            <CalculatorNumberInput id="current-age" label="Current age" suffix="years" min={RETIREMENT_LIMITS.currentAge.min} max={RETIREMENT_LIMITS.currentAge.max} step={1} value={values.currentAge} onValueChange={(value) => update("currentAge", value)} error={errors.currentAge} required />
            <CalculatorNumberInput id="retirement-age" label="Retirement age" suffix="years" min={RETIREMENT_LIMITS.retirementAge.min} max={RETIREMENT_LIMITS.retirementAge.max} step={1} value={values.retirementAge} onValueChange={(value) => update("retirementAge", value)} error={errors.retirementAge} required />
            <CalculatorNumberInput id="current-savings" label="Current savings" prefix="₹" min={RETIREMENT_LIMITS.currentSavings.min} max={RETIREMENT_LIMITS.currentSavings.max} step={10_000} value={values.currentSavings} onValueChange={(value) => update("currentSavings", value)} error={errors.currentSavings} required />
            <CalculatorNumberInput id="monthly-contribution" label="Monthly contribution" prefix="₹" min={RETIREMENT_LIMITS.monthlyContribution.min} max={RETIREMENT_LIMITS.monthlyContribution.max} step={500} value={values.monthlyContribution} onValueChange={(value) => update("monthlyContribution", value)} error={errors.monthlyContribution} required />
            <CalculatorNumberInput id="pre-return" label="Expected annual return before retirement" description="A constant modelling assumption for this scenario, not a forecast or guaranteed return." suffix="%" min={RETIREMENT_LIMITS.expectedReturnPreRetirement.min} max={RETIREMENT_LIMITS.expectedReturnPreRetirement.max} step={0.1} value={values.expectedReturnPreRetirement} onValueChange={(value) => update("expectedReturnPreRetirement", value)} error={errors.expectedReturnPreRetirement} required />
          </fieldset>
          <fieldset className="space-y-5 border-t pt-6">
            <legend className="text-base font-semibold">Retirement phase (from retirement to life expectancy)</legend>
            <CalculatorNumberInput id="life-expectancy" label="Life expectancy" suffix="years" min={RETIREMENT_LIMITS.lifeExpectancy.min} max={RETIREMENT_LIMITS.lifeExpectancy.max} step={1} value={values.lifeExpectancy} onValueChange={(value) => update("lifeExpectancy", value)} error={errors.lifeExpectancy} required />
            <CalculatorNumberInput id="post-return" label="Expected annual return during retirement" description="Starts equal to the pre-retirement return; lower it for a more conservative post-retirement allocation." suffix="%" min={RETIREMENT_LIMITS.expectedReturnPostRetirement.min} max={RETIREMENT_LIMITS.expectedReturnPostRetirement.max} step={0.1} value={values.expectedReturnPostRetirement} onValueChange={(value) => update("expectedReturnPostRetirement", value)} error={errors.expectedReturnPostRetirement} required />
            <CalculatorNumberInput id="withdrawal" label="Desired monthly withdrawal (today's money)" description="The nominal (actual rupee) monthly withdrawal grows with assumed inflation each year of retirement." prefix="₹" min={RETIREMENT_LIMITS.desiredMonthlyWithdrawal.min} max={RETIREMENT_LIMITS.desiredMonthlyWithdrawal.max} step={1_000} value={values.desiredMonthlyWithdrawal} onValueChange={(value) => update("desiredMonthlyWithdrawal", value)} error={errors.desiredMonthlyWithdrawal} required />
            <CalculatorNumberInput id="inflation" label="Assumed annual inflation rate" description="A negative value models deflation." suffix="%" min={RETIREMENT_LIMITS.inflationRate.min} max={RETIREMENT_LIMITS.inflationRate.max} step={0.1} value={values.inflationRate} onValueChange={(value) => update("inflationRate", value)} error={errors.inflationRate} required />
          </fieldset>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" className="flex-1">Calculate retirement corpus</Button>
            <Button type="button" size="lg" variant="outline" className="flex-1" onClick={reset}>Reset</Button>
          </div>
        </form>
      </CalculatorShell>
    </div>
    <div className="space-y-6">
      <CalculatorResultCard title="Retirement corpus estimate" items={calculation ? resultItems(calculation.result) : []} emptyTitle="Your projection will appear here" emptyDescription="Enter both phases, then calculate." />
      {calculation ? <>
        <CalculatorActions resultText={copiedText} shareUrl={buildRetirementCalculatorUrl(calculation.input, "https://thinkcalculator.in")} />
        <CalculationSummary
          title="ThinkCalculator Retirement Corpus Estimate"
          calculationDate={calculation.date}
          disclaimer="This is an illustrative projection based on constant assumed rates, not a retirement plan. It excludes sequence-of-returns risk, healthcare costs, taxation, and government pension income."
          items={[
            { label: "Current age / retirement age / life expectancy", value: `${calculation.input.currentAge} / ${calculation.input.retirementAge} / ${calculation.input.lifeExpectancy}` },
            { label: "Current savings", value: formatIndianCurrency(calculation.input.currentSavings) },
            { label: "Monthly contribution", value: formatIndianCurrency(calculation.input.monthlyContribution) },
            { label: "Expected return before / during retirement", value: `${formatPercentage(calculation.input.expectedReturnPreRetirement)} / ${formatPercentage(calculation.input.expectedReturnPostRetirement)}` },
            { label: "Desired monthly withdrawal (today's money)", value: formatIndianCurrency(calculation.input.desiredMonthlyWithdrawal) },
            { label: "Assumed annual inflation", value: formatPercentage(calculation.input.inflationRate) },
            { label: "Corpus at retirement", value: formatIndianCurrency(calculation.result.corpusAtRetirement) },
            { label: "Total contributions", value: formatIndianCurrency(calculation.result.totalContributions) },
            { label: "Retirement outcome", value: calculation.result.isExhausted ? `Corpus exhausted at age ${calculation.result.exhaustionAge}` : `Remaining balance at life expectancy: ${formatIndianCurrency(calculation.result.remainingBalanceAtLifeExpectancy)}` },
          ]}
        />
      </> : null}
    </div>
    {calculation ? (
      // Both schedules share ONE data-calculation-experience wrapper rather than one each: the print
      // stylesheet (app/globals.css) absolutely positions every [data-calculation-experience] element
      // at the same fixed offset below the summary, so two independently tagged sections would print
      // stacked on top of each other. Nesting them inside a single tagged container lets them stack
      // normally within it instead.
      <div className="col-span-full space-y-16 sm:space-y-20" data-calculation-experience aria-label="Accumulation and retirement withdrawal schedules">
        <section>
          <h2 className="text-2xl font-semibold">Accumulation schedule</h2>
          <p className="mt-3 text-muted-foreground">Each year&apos;s contribution is added before that year&apos;s growth is applied. Displayed currency is rounded; calculations retain precision.</p>
          <div className="mt-6"><DataTable caption="Retirement Corpus accumulation-phase yearly schedule, from current age to retirement age" rows={calculation.result.accumulationSchedule} columns={accumulationColumns} /></div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Retirement withdrawal schedule</h2>
          <p className="mt-3 text-muted-foreground">Each year&apos;s withdrawals are taken before that year&apos;s growth is applied to the remaining balance, and the monthly withdrawal amount grows with assumed inflation each year. Displayed currency is rounded; calculations retain precision.</p>
          <div className="mt-6"><DataTable caption="Retirement Corpus retirement-phase yearly withdrawal schedule, from retirement age to life expectancy" rows={calculation.result.decumulationSchedule} columns={decumulationColumns} /></div>
        </section>
      </div>
    ) : null}
  </>
}
