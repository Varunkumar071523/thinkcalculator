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
import { calculateAmortizationSchedule } from "@/features/calculators/emi/calculate-amortization"
import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import { calculateYearlyAmortization, type YearlyAmortizationRow } from "@/features/calculators/emi/calculate-yearly-amortization"
import { EMI_LIMITS, parseAndValidateEMIForm, type EMIFormValues } from "@/features/calculators/emi/emi-schema"
import { buildEMICalculatorUrl, EMI_DEFAULT_INPUT, parseEMIUrlState } from "@/features/calculators/emi/emi-url-state"
import type { AmortizationRow, EMIInput, EMIValidationErrors, TenureUnit } from "@/features/calculators/emi/emi-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

const PRINCIPAL_QUICK_AMOUNTS = [
  { label: "15L", value: "1500000" },
  { label: "25L", value: "2500000" },
  { label: "50L", value: "5000000" },
  { label: "1Cr", value: "10000000" },
]

const monthlyScheduleColumns: readonly DataTableColumn<AmortizationRow>[] = [
  { header: "Payment", cell: (row) => row.paymentNumber },
  { header: "Opening balance", cell: (row) => formatIndianCurrency(row.openingBalance) },
  { header: "EMI", cell: (row) => formatIndianCurrency(row.emi) },
  { header: "Principal", cell: (row) => formatIndianCurrency(row.principalPaid) },
  { header: "Interest", cell: (row) => formatIndianCurrency(row.interestPaid) },
  { header: "Closing balance", cell: (row) => formatIndianCurrency(row.closingBalance) },
]

const yearlyScheduleColumns: readonly DataTableColumn<YearlyAmortizationRow>[] = [
  { header: "Year", cell: (row) => `Year ${row.year}` },
  { header: "Principal paid", cell: (row) => formatIndianCurrency(row.principalPaid) },
  { header: "Interest paid", cell: (row) => formatIndianCurrency(row.interestPaid) },
  { header: "Yearly total", cell: (row) => formatIndianCurrency(row.yearlyTotal) },
  { header: "Balance remaining", cell: (row) => formatIndianCurrency(row.balanceRemaining) },
]

function toFormValues(input: EMIInput): EMIFormValues {
  return { principalAmount: String(input.principalAmount), annualInterestRate: String(input.annualInterestRate), tenure: String(input.tenure), tenureUnit: input.tenureUnit }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: EMIFormValues): EMIInput {
  const tenureUnit: TenureUnit = values.tenureUnit === "months" ? "months" : "years"
  const tenureLimits = tenureUnit === "years" ? EMI_LIMITS.tenureYears : EMI_LIMITS.tenureMonths
  return {
    principalAmount: clampFinite(Number(values.principalAmount), EMI_DEFAULT_INPUT.principalAmount, EMI_LIMITS.principalAmount.min, EMI_LIMITS.principalAmount.max),
    annualInterestRate: clampFinite(Number(values.annualInterestRate), EMI_DEFAULT_INPUT.annualInterestRate, EMI_LIMITS.annualInterestRate.min, EMI_LIMITS.annualInterestRate.max),
    tenure: Math.round(clampFinite(Number(values.tenure), EMI_DEFAULT_INPUT.tenure, tenureLimits.min, tenureLimits.max)),
    tenureUnit,
  }
}

export function EMICalculator() {
  const [values, setValues] = useState<EMIFormValues>(() => toFormValues(EMI_DEFAULT_INPUT))
  const [errors, setErrors] = useState<EMIValidationErrors>({})
  const [showMonthlySchedule, setShowMonthlySchedule] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseEMIUrlState(search)))
  })

  function updateValue(field: keyof EMIFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateEMIForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildEMICalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(EMI_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/emi-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateEMI(liveInput), [liveInput])
  const monthlySchedule = useMemo(() => calculateAmortizationSchedule(liveInput, result), [liveInput, result])
  const yearlySchedule = useMemo(() => calculateYearlyAmortization(monthlySchedule), [monthlySchedule])

  const principalPercent = result.totalPayment > 0 ? Math.round((result.principalAmount / result.totalPayment) * 100) : 100
  const interestPercent = 100 - principalPercent
  const tenureIsYears = liveInput.tenureUnit === "years"

  const shareUrl = buildEMICalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
  const resultText = [
    "ThinkCalculator EMI Calculation", "",
    `Loan amount: ${formatIndianCurrency(liveInput.principalAmount)}`,
    `Annual interest rate: ${formatPercentage(liveInput.annualInterestRate)}`,
    `Loan tenure: ${liveInput.tenure} ${liveInput.tenureUnit}`,
    `Monthly EMI: ${formatIndianCurrency(result.monthlyEMI)}`,
    `Total interest: ${formatIndianCurrency(result.totalInterest)}`,
    `Total repayment: ${formatIndianCurrency(result.totalPayment)}`,
    "", "Calculator:", `${siteConfig.url}/finance/emi-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Loan details</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <CalculatorNumberInput id="loan-amount" label="Loan amount" description="Enter the principal amount you plan to borrow." prefix="₹" min={EMI_LIMITS.principalAmount.min} max={EMI_LIMITS.principalAmount.max} step={10_000} value={values.principalAmount} onValueChange={(value) => updateValue("principalAmount", value)} error={errors.principalAmount} required />
                  <input type="range" aria-label="Loan amount slider" min={EMI_LIMITS.principalAmount.min} max={EMI_LIMITS.principalAmount.max} step={10_000} value={liveInput.principalAmount} onChange={(event) => updateValue("principalAmount", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                  <div className="mt-2 flex gap-1.5">
                    {PRINCIPAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("principalAmount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-money hover:text-money focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" description="Enter the annual rate offered by the lender." suffix="%" min={0} max={EMI_LIMITS.annualInterestRate.max} step={0.05} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
                  <input type="range" aria-label="Annual interest rate slider" min={1} max={20} step={0.05} value={liveInput.annualInterestRate} onChange={(event) => updateValue("annualInterestRate", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                </div>

                <div>
                  <CalculatorNumberInput id="loan-tenure" label="Loan tenure" description="Enter the length of the repayment period." suffix={tenureIsYears ? "years" : "months"} min={1} max={tenureIsYears ? EMI_LIMITS.tenureYears.max : EMI_LIMITS.tenureMonths.max} step={1} value={values.tenure} onValueChange={(value) => updateValue("tenure", value)} error={errors.tenure} required />
                  <input type="range" aria-label="Loan tenure slider" min={tenureIsYears ? EMI_LIMITS.tenureYears.min : EMI_LIMITS.tenureMonths.min} max={tenureIsYears ? EMI_LIMITS.tenureYears.max : EMI_LIMITS.tenureMonths.max} step={1} value={liveInput.tenure} onChange={(event) => updateValue("tenure", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-money" />
                </div>

                <CalculatorSelectInput id="tenure-unit" label="Tenure unit" value={values.tenureUnit} onValueChange={(value) => updateValue("tenureUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.tenureUnit} required />

                <div className="rounded-lg border border-dashed border-line p-4 text-[13px] leading-6 text-muted-foreground">
                  EMI is calculated as <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-ink">P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)</code>, where P is principal, r is the monthly interest rate, and n is the number of monthly instalments.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate EMI</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-money-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Monthly EMI</p>
              <p className="font-mono text-[42px] leading-none font-bold text-money">{formatIndianCurrency(result.monthlyEMI)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">for {result.totalMonths} months at {liveInput.annualInterestRate.toFixed(2)}% p.a.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total interest payable</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalInterest)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total repayment</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalPayment)}</p>
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
          title="ThinkCalculator EMI Calculation"
          calculationDate={calculationDate}
          disclaimer="This estimate is for informational purposes only. Lender calculations may differ because of rounding, fees, rate changes, and lender-specific methods."
          items={[
            { label: "Loan amount", value: formatIndianCurrency(liveInput.principalAmount) },
            { label: "Annual interest rate", value: formatPercentage(liveInput.annualInterestRate) },
            { label: "Loan tenure", value: `${liveInput.tenure} ${liveInput.tenureUnit}` },
            { label: "Monthly EMI", value: formatIndianCurrency(result.monthlyEMI) },
            { label: "Total interest", value: formatIndianCurrency(result.totalInterest) },
            { label: "Total repayment", value: formatIndianCurrency(result.totalPayment) },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="amortization-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Amortization schedule</p>
            <h2 id="amortization-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Yearly repayment breakdown</h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">How much of each year&apos;s payments goes to principal vs interest.</p>
          </div>
          <Button type="button" variant="outline" data-print-hide onClick={() => setShowMonthlySchedule((value) => !value)}>{showMonthlySchedule ? "View yearly summary" : "View month-by-month"}</Button>
        </div>
        <div className="mt-6">
          {showMonthlySchedule ? (
            <DataTable caption="Monthly EMI amortization schedule" rows={monthlySchedule} columns={monthlyScheduleColumns} />
          ) : (
            <DataTable caption="Yearly EMI amortization schedule" rows={yearlySchedule} columns={yearlyScheduleColumns} initialRows={15} />
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
      </section>
    </div>
  )
}
