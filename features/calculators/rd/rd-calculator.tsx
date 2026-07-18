"use client"

import { useMemo, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { calculateRD } from "@/features/calculators/rd/calculate-rd"
import { calculateRDSchedule } from "@/features/calculators/rd/calculate-rd-schedule"
import { calculateRDYearlySchedule, type RDYearlyScheduleRow } from "@/features/calculators/rd/calculate-rd-yearly-schedule"
import { RD_LIMITS, parseAndValidateRDForm, type RDFormValues } from "@/features/calculators/rd/rd-schema"
import { buildRDCalculatorUrl, parseRDUrlState, RD_DEFAULT_INPUT } from "@/features/calculators/rd/rd-url-state"
import type { RDCompoundingFrequency, RDDurationUnit, RDInput, RDScheduleRow, RDValidationErrors } from "@/features/calculators/rd/rd-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const FREQUENCY_LABELS: Readonly<Record<RDCompoundingFrequency, string>> = { monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", yearly: "Yearly" }
const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))

const DEPOSIT_QUICK_AMOUNTS = [
  { label: "2K", value: "2000" },
  { label: "5K", value: "5000" },
  { label: "10K", value: "10000" },
  { label: "25K", value: "25000" },
]

const yearlyScheduleColumns: readonly DataTableColumn<RDYearlyScheduleRow>[] = [
  { header: "Year", cell: (row) => `Year ${row.year}` },
  { header: "Yearly growth", cell: (row) => formatIndianCurrency(row.yearlyGrowth) },
  { header: "Total deposited to date", cell: (row) => formatIndianCurrency(row.totalDeposited) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

const detailedScheduleColumns: readonly DataTableColumn<RDScheduleRow>[] = [
  { header: "Period", cell: (row) => row.periodNumber },
  { header: "Months elapsed", cell: (row) => row.monthsElapsed },
  { header: "Total deposited", cell: (row) => formatIndianCurrency(row.totalDeposited) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

function toFormValues(input: RDInput): RDFormValues {
  return { monthlyDeposit: String(input.monthlyDeposit), annualInterestRate: String(input.annualInterestRate), duration: String(input.duration), durationUnit: input.durationUnit, compoundingFrequency: input.compoundingFrequency }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isDurationUnit(value: string): value is RDDurationUnit {
  return value === "years" || value === "months"
}

function isCompoundingFrequency(value: string): value is RDCompoundingFrequency {
  return value === "monthly" || value === "quarterly" || value === "half-yearly" || value === "yearly"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke instead of waiting for a valid, submitted form. */
function toLiveInput(values: RDFormValues): RDInput {
  const durationUnit: RDDurationUnit = isDurationUnit(values.durationUnit) ? values.durationUnit : "years"
  const compoundingFrequency: RDCompoundingFrequency = isCompoundingFrequency(values.compoundingFrequency) ? values.compoundingFrequency : "quarterly"
  return {
    monthlyDeposit: clampFinite(Number(values.monthlyDeposit), RD_DEFAULT_INPUT.monthlyDeposit, RD_LIMITS.monthlyDeposit.min, RD_LIMITS.monthlyDeposit.max),
    annualInterestRate: clampFinite(Number(values.annualInterestRate), RD_DEFAULT_INPUT.annualInterestRate, RD_LIMITS.annualInterestRate.min, RD_LIMITS.annualInterestRate.max),
    duration: Math.round(clampFinite(Number(values.duration), RD_DEFAULT_INPUT.duration, RD_LIMITS.duration.min, RD_LIMITS.duration.max)),
    durationUnit,
    compoundingFrequency,
  }
}

export function RDCalculator() {
  const [values, setValues] = useState<RDFormValues>(() => toFormValues(RD_DEFAULT_INPUT))
  const [errors, setErrors] = useState<RDValidationErrors>({})
  const [showDetailedSchedule, setShowDetailedSchedule] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseRDUrlState(search)))
  })

  function updateValue(field: keyof RDFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateRDForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildRDCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(RD_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/rd-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateRD(liveInput), [liveInput])
  const yearlySchedule = useMemo(() => calculateRDYearlySchedule(liveInput), [liveInput])
  const detailedSchedule = useMemo(() => calculateRDSchedule(liveInput), [liveInput])

  const depositedPercent = result.maturityAmount > 0 ? Math.round((result.totalDeposited / result.maturityAmount) * 100) : 100
  const interestPercent = 100 - depositedPercent
  const durationIsYears = liveInput.durationUnit === "years"

  const shareUrl = buildRDCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
  const resultText = [
    "ThinkCalculator RD Calculation", "",
    `Monthly deposit: ${formatIndianCurrency(liveInput.monthlyDeposit)}`,
    `Annual interest rate: ${formatPercentage(liveInput.annualInterestRate)}`,
    `Deposit duration: ${liveInput.duration} ${liveInput.durationUnit}`,
    `Compounding frequency: ${FREQUENCY_LABELS[liveInput.compoundingFrequency]}`,
    `Total deposited: ${formatIndianCurrency(result.totalDeposited)}`,
    `Interest earned: ${formatIndianCurrency(result.interestEarned)}`,
    `Maturity amount: ${formatIndianCurrency(result.maturityAmount)}`,
    "", "Calculator:", `${siteConfig.url}/finance/rd-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Deposit details</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <CalculatorNumberInput id="monthly-deposit" label="Monthly deposit" description="Enter the amount deposited at the beginning of each month." prefix="₹" min={RD_LIMITS.monthlyDeposit.min} max={RD_LIMITS.monthlyDeposit.max} step={100} value={values.monthlyDeposit} onValueChange={(value) => updateValue("monthlyDeposit", value)} error={errors.monthlyDeposit} required />
                  <input type="range" aria-label="Monthly deposit slider" min={RD_LIMITS.monthlyDeposit.min} max={RD_LIMITS.monthlyDeposit.max} step={100} value={liveInput.monthlyDeposit} onChange={(event) => updateValue("monthlyDeposit", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                  <div className="mt-2 flex gap-1.5">
                    {DEPOSIT_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("monthlyDeposit", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-money hover:text-money focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" suffix="%" min={RD_LIMITS.annualInterestRate.min} max={RD_LIMITS.annualInterestRate.max} step={0.01} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
                  <input type="range" aria-label="Annual interest rate slider" min={1} max={20} step={0.01} value={liveInput.annualInterestRate} onChange={(event) => updateValue("annualInterestRate", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                </div>

                <CalculatorNumberInput id="deposit-duration" label="Deposit duration" suffix={durationIsYears ? "years" : "months"} min={RD_LIMITS.duration.min} max={RD_LIMITS.duration.max} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
                <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
                <CalculatorSelectInput id="compounding-frequency" label="Compounding frequency" value={values.compoundingFrequency} onValueChange={(value) => updateValue("compoundingFrequency", value)} options={FREQUENCY_OPTIONS} error={errors.compoundingFrequency} required />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate RD</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-savings-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Maturity amount</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-savings">{formatIndianCurrency(result.maturityAmount)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">over {result.totalMonths} months at {liveInput.annualInterestRate.toFixed(2)}% p.a. ({FREQUENCY_LABELS[liveInput.compoundingFrequency]} compounding)</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total deposited</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalDeposited)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Interest earned</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.interestEarned)}</p>
              </div>
            </div>

            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={`Deposited ${depositedPercent}%, interest ${interestPercent}%`}>
              <div className="bg-money" style={{ width: `${depositedPercent}%` }} />
              <div className="border border-gold bg-gold-soft" style={{ width: `${interestPercent}%` }} />
            </div>
            <div className="mt-2.5 flex gap-4.5 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-money" aria-hidden="true" />Deposited {depositedPercent}%</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-gold bg-gold-soft" aria-hidden="true" />Interest {interestPercent}%</span>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendered outside the gradient Card (which sets overflow-hidden) so the print stylesheet's
          `position: absolute` repositioning of [data-print-summary] is never clipped by it. */}
      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator RD Calculation"
          calculationDate={calculationDate}
          disclaimer="This estimate is informational. Actual bank treatment may differ by deposit date, product rules, rounding, taxes, and penalties."
          items={[
            { label: "Monthly deposit", value: formatIndianCurrency(liveInput.monthlyDeposit) },
            { label: "Annual interest rate", value: formatPercentage(liveInput.annualInterestRate) },
            { label: "Deposit duration", value: `${liveInput.duration} ${liveInput.durationUnit}` },
            { label: "Compounding frequency", value: FREQUENCY_LABELS[liveInput.compoundingFrequency] },
            { label: "Total deposited", value: formatIndianCurrency(result.totalDeposited) },
            { label: "Interest earned", value: formatIndianCurrency(result.interestEarned) },
            { label: "Maturity amount", value: formatIndianCurrency(result.maturityAmount) },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="rd-schedule-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-cat-savings uppercase">Maturity schedule</p>
            <h2 id="rd-schedule-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Yearly maturity growth</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">How cumulative deposits and interest grow year by year under the selected compounding convention.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setShowDetailedSchedule((value) => !value)}>{showDetailedSchedule ? "View yearly summary" : "View detailed schedule"}</Button>
        </div>
        <div className="mt-6">
          {showDetailedSchedule ? (
            <DataTable caption="Detailed RD maturity schedule" rows={detailedSchedule} columns={detailedScheduleColumns} />
          ) : (
            <DataTable caption="Yearly RD maturity schedule" rows={yearlySchedule} columns={yearlyScheduleColumns} initialRows={15} />
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
      </section>
    </div>
  )
}
