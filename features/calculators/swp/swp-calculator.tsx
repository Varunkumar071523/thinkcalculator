"use client"

import { useMemo, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { DecliningBalanceChart, MilestoneRow, pickMilestoneIndices, type MilestoneItem } from "@/components/calculators/growth-area-chart"
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
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateSWPForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildSWPCalculatorUrl(validation.data))
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

  const shareUrl = buildSWPCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
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
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <CalculatorNumberInput id="initial-investment" label="Initial investment" description="Enter the corpus you'll withdraw from." prefix="₹" min={SWP_LIMITS.initialInvestment.min} max={SWP_LIMITS.initialInvestment.max} step={10_000} value={values.initialInvestment} onValueChange={(value) => updateValue("initialInvestment", value)} error={errors.initialInvestment} required />
                  <input type="range" aria-label="Initial investment slider" min={SWP_LIMITS.initialInvestment.min} max={SWP_LIMITS.initialInvestment.max} step={10_000} value={liveInput.initialInvestment} onChange={(event) => updateValue("initialInvestment", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  <div className="mt-2 flex gap-1.5">
                    {INITIAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("initialInvestment", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <CalculatorNumberInput id="monthly-withdrawal" label="Monthly withdrawal" description="Enter the fixed amount to withdraw every month." prefix="₹" min={SWP_LIMITS.monthlyWithdrawal.min} max={SWP_LIMITS.monthlyWithdrawal.max} step={500} value={values.monthlyWithdrawal} onValueChange={(value) => updateValue("monthlyWithdrawal", value)} error={errors.monthlyWithdrawal} required />
                  <input type="range" aria-label="Monthly withdrawal slider" min={SWP_LIMITS.monthlyWithdrawal.min} max={SWP_LIMITS.monthlyWithdrawal.max} step={500} value={liveInput.monthlyWithdrawal} onChange={(event) => updateValue("monthlyWithdrawal", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div>
                  <CalculatorNumberInput id="expected-return" label="Expected annual return assumption" description="A constant modelling assumption for this scenario, not a forecast or guaranteed return." suffix="%" min={SWP_LIMITS.expectedAnnualReturn.min} max={SWP_LIMITS.expectedAnnualReturn.max} step={0.1} value={values.expectedAnnualReturn} onValueChange={(value) => updateValue("expectedAnnualReturn", value)} error={errors.expectedAnnualReturn} required />
                  <input type="range" aria-label="Expected annual return slider" min={1} max={20} step={0.1} value={liveInput.expectedAnnualReturn} onChange={(event) => updateValue("expectedAnnualReturn", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <CalculatorSelectInput id="withdrawal-mode" label="Withdrawal duration" value={values.withdrawalMode} onValueChange={(value) => updateValue("withdrawalMode", value)} options={[{ label: "Fixed duration", value: "fixedDuration" }, { label: "Until balance is exhausted", value: "untilExhausted" }]} error={errors.withdrawalMode} required />

                {isFixedDuration ? (
                  <div>
                    <CalculatorNumberInput id="duration-years" label="Withdrawal duration" suffix="years" min={SWP_LIMITS.durationYears.min} max={SWP_LIMITS.durationYears.max} step={1} value={values.durationYears} onValueChange={(value) => updateValue("durationYears", value)} error={errors.durationYears} required />
                    <input type="range" aria-label="Withdrawal duration slider" min={SWP_LIMITS.durationYears.min} max={SWP_LIMITS.durationYears.max} step={1} value={liveInput.durationYears} onChange={(event) => updateValue("durationYears", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate SWP</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
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

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator SWP Estimate"
          calculationDate={calculationDate}
          disclaimer="Market returns are uncertain and not guaranteed. This projection excludes taxation of withdrawals and product-specific rules."
          items={[
            { label: "Initial investment", value: formatIndianCurrency(liveInput.initialInvestment) },
            { label: "Monthly withdrawal", value: formatIndianCurrency(liveInput.monthlyWithdrawal) },
            { label: "Expected annual return assumption", value: formatPercentage(liveInput.expectedAnnualReturn) },
            { label: "Withdrawal duration", value: isFixedDuration ? `${liveInput.durationYears} years, fixed` : "Until balance is exhausted" },
            { label: "Total withdrawn", value: formatIndianCurrency(result.totalWithdrawn) },
            { label: "Total growth", value: formatIndianCurrency(result.totalGrowth) },
            { label: "Remaining balance", value: formatIndianCurrency(result.remainingBalance) },
            { label: "Balance exhausted", value: result.isExhausted ? `Yes, after ${formatDurationText(result.exhaustionMonth!)}` : "No" },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="swp-schedule-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-cat-invest uppercase">Balance over time</p>
            <h2 id="swp-schedule-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">How your balance depletes</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each year&apos;s withdrawals are taken before that year&apos;s growth is applied to the remaining balance.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
        </div>
        <div className="mt-6">
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
      </section>
    </div>
  )
}
