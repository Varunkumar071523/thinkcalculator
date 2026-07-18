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
import { calculateFD } from "@/features/calculators/fd/calculate-fd"
import { calculateFDSchedule } from "@/features/calculators/fd/calculate-fd-schedule"
import { calculateFDYearlySchedule, type FDYearlyScheduleRow } from "@/features/calculators/fd/calculate-fd-yearly-schedule"
import { FD_LIMITS, parseAndValidateFDForm, type FDFormValues } from "@/features/calculators/fd/fd-schema"
import { buildFDCalculatorUrl, FD_DEFAULT_INPUT, parseFDUrlState } from "@/features/calculators/fd/fd-url-state"
import type { FDCompoundingFrequency, FDDurationUnit, FDInput, FDScheduleRow, FDValidationErrors } from "@/features/calculators/fd/fd-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const FREQUENCY_LABELS: Readonly<Record<FDCompoundingFrequency, string>> = { monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", yearly: "Yearly" }
const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))

const PRINCIPAL_QUICK_AMOUNTS = [
  { label: "25K", value: "25000" },
  { label: "1L", value: "100000" },
  { label: "5L", value: "500000" },
  { label: "10L", value: "1000000" },
]

const yearlyScheduleColumns: readonly DataTableColumn<FDYearlyScheduleRow>[] = [
  { header: "Year", cell: (row) => `Year ${row.year}` },
  { header: "Yearly growth", cell: (row) => formatIndianCurrency(row.yearlyGrowth) },
  { header: "Interest earned to date", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

const detailedScheduleColumns: readonly DataTableColumn<FDScheduleRow>[] = [
  { header: "Period", cell: (row) => row.periodNumber },
  { header: "Months elapsed", cell: (row) => row.monthsElapsed },
  { header: "Interest earned", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Maturity value", cell: (row) => formatIndianCurrency(row.maturityAmount) },
]

function toFormValues(input: FDInput): FDFormValues {
  return { principalAmount: String(input.principalAmount), annualInterestRate: String(input.annualInterestRate), duration: String(input.duration), durationUnit: input.durationUnit, compoundingFrequency: input.compoundingFrequency }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isDurationUnit(value: string): value is FDDurationUnit {
  return value === "years" || value === "months"
}

function isCompoundingFrequency(value: string): value is FDCompoundingFrequency {
  return value === "monthly" || value === "quarterly" || value === "half-yearly" || value === "yearly"
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke instead of waiting for a valid, submitted form. */
function toLiveInput(values: FDFormValues): FDInput {
  const durationUnit: FDDurationUnit = isDurationUnit(values.durationUnit) ? values.durationUnit : "years"
  const durationLimits = durationUnit === "years" ? FD_LIMITS.durationYears : FD_LIMITS.durationMonths
  const compoundingFrequency: FDCompoundingFrequency = isCompoundingFrequency(values.compoundingFrequency) ? values.compoundingFrequency : "quarterly"
  return {
    principalAmount: clampFinite(Number(values.principalAmount), FD_DEFAULT_INPUT.principalAmount, FD_LIMITS.principalAmount.min, FD_LIMITS.principalAmount.max),
    annualInterestRate: clampFinite(Number(values.annualInterestRate), FD_DEFAULT_INPUT.annualInterestRate, FD_LIMITS.annualInterestRate.min, FD_LIMITS.annualInterestRate.max),
    duration: Math.round(clampFinite(Number(values.duration), FD_DEFAULT_INPUT.duration, durationLimits.min, durationLimits.max)),
    durationUnit,
    compoundingFrequency,
  }
}

export function FDCalculator() {
  const [values, setValues] = useState<FDFormValues>(() => toFormValues(FD_DEFAULT_INPUT))
  const [errors, setErrors] = useState<FDValidationErrors>({})
  const [showDetailedSchedule, setShowDetailedSchedule] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseFDUrlState(search)))
  })

  function updateValue(field: keyof FDFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateFDForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildFDCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(FD_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/fd-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateFD(liveInput), [liveInput])
  const yearlySchedule = useMemo(() => calculateFDYearlySchedule(liveInput), [liveInput])
  const detailedSchedule = useMemo(() => calculateFDSchedule(liveInput), [liveInput])

  const principalPercent = result.maturityAmount > 0 ? Math.round((result.principalAmount / result.maturityAmount) * 100) : 100
  const interestPercent = 100 - principalPercent
  const durationIsYears = liveInput.durationUnit === "years"

  const shareUrl = buildFDCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
  const resultText = [
    "ThinkCalculator FD Calculation", "",
    `Deposit amount: ${formatIndianCurrency(liveInput.principalAmount)}`,
    `Annual interest rate: ${formatPercentage(liveInput.annualInterestRate)}`,
    `Deposit duration: ${liveInput.duration} ${liveInput.durationUnit}`,
    `Compounding frequency: ${FREQUENCY_LABELS[liveInput.compoundingFrequency]}`,
    `Interest earned: ${formatIndianCurrency(result.interestEarned)}`,
    `Maturity amount: ${formatIndianCurrency(result.maturityAmount)}`,
    "", "Calculator:", `${siteConfig.url}/finance/fd-calculator`,
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
                  <CalculatorNumberInput id="deposit-amount" label="Deposit amount" description="Enter the principal amount placed in the fixed deposit." prefix="₹" min={FD_LIMITS.principalAmount.min} max={FD_LIMITS.principalAmount.max} step={1_000} value={values.principalAmount} onValueChange={(value) => updateValue("principalAmount", value)} error={errors.principalAmount} required />
                  <input type="range" aria-label="Deposit amount slider" min={FD_LIMITS.principalAmount.min} max={FD_LIMITS.principalAmount.max} step={1_000} value={liveInput.principalAmount} onChange={(event) => updateValue("principalAmount", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                  <div className="mt-2 flex gap-1.5">
                    {PRINCIPAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("principalAmount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-money hover:text-money focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" description="Enter the annual rate offered for the deposit." suffix="%" min={FD_LIMITS.annualInterestRate.min} max={FD_LIMITS.annualInterestRate.max} step={0.01} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
                  <input type="range" aria-label="Annual interest rate slider" min={1} max={20} step={0.01} value={liveInput.annualInterestRate} onChange={(event) => updateValue("annualInterestRate", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                </div>

                <CalculatorNumberInput id="deposit-duration" label="Deposit duration" description="Enter how long the deposit will remain invested." suffix={durationIsYears ? "years" : "months"} min={1} max={durationIsYears ? FD_LIMITS.durationYears.max : FD_LIMITS.durationMonths.max} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
                <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
                <CalculatorSelectInput id="compounding-frequency" label="Compounding frequency" description="Choose how often interest is added to the deposit." value={values.compoundingFrequency} onValueChange={(value) => updateValue("compoundingFrequency", value)} options={FREQUENCY_OPTIONS} error={errors.compoundingFrequency} required />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate FD</Button>
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
                <p className="mb-1 text-xs text-muted-foreground">Principal amount</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.principalAmount)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Interest earned</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.interestEarned)}</p>
              </div>
            </div>

            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={`Principal ${principalPercent}%, interest ${interestPercent}%`}>
              <div className="bg-money" style={{ width: `${principalPercent}%` }} />
              <div className="border border-gold bg-gold-soft" style={{ width: `${interestPercent}%` }} />
            </div>
            <div className="mt-2.5 flex gap-4.5 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-money" aria-hidden="true" />Principal {principalPercent}%</span>
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
          title="ThinkCalculator FD Calculation"
          calculationDate={calculationDate}
          disclaimer="This estimate is informational. Actual bank calculations may differ because of product rules, dates, rounding, taxes, and penalties."
          items={[
            { label: "Deposit amount", value: formatIndianCurrency(liveInput.principalAmount) },
            { label: "Annual interest rate", value: formatPercentage(liveInput.annualInterestRate) },
            { label: "Deposit duration", value: `${liveInput.duration} ${liveInput.durationUnit}` },
            { label: "Compounding frequency", value: FREQUENCY_LABELS[liveInput.compoundingFrequency] },
            { label: "Interest earned", value: formatIndianCurrency(result.interestEarned) },
            { label: "Maturity amount", value: formatIndianCurrency(result.maturityAmount) },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="fd-schedule-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-cat-savings uppercase">Maturity schedule</p>
            <h2 id="fd-schedule-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Yearly maturity growth</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">How the deposit grows year by year under the selected compounding convention.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setShowDetailedSchedule((value) => !value)}>{showDetailedSchedule ? "View yearly summary" : "View detailed schedule"}</Button>
        </div>
        <div className="mt-6">
          {showDetailedSchedule ? (
            <DataTable caption="Detailed FD maturity schedule" rows={detailedSchedule} columns={detailedScheduleColumns} />
          ) : (
            <DataTable caption="Yearly FD maturity schedule" rows={yearlySchedule} columns={yearlyScheduleColumns} initialRows={15} />
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
      </section>
    </div>
  )
}
