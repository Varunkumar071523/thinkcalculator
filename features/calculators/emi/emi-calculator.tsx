"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
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
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateEMIForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildEMICalculatorUrl(validation.data))
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
  const tenureIsYears = liveInput.tenureUnit === "years"

  useTrackCalculationCompleted("emi", "loans", result)

  const yearlyChartLabels = useMemo(() => yearlySchedule.map((row) => `Y${row.year}`), [yearlySchedule])
  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Principal", values: yearlySchedule.map((row) => Math.round(row.principalPaid)), colorVar: "--money" },
    { label: "Interest", values: yearlySchedule.map((row) => Math.round(row.interestPaid)), colorVar: "--gold" },
  ], [yearlySchedule])

  const shareUrl = buildEMICalculatorUrl(liveInput, siteConfig.url)
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
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="loan-amount"
                    label="Loan amount"
                    description="Enter the principal amount you plan to borrow."
                    prefix="₹"
                    min={EMI_LIMITS.principalAmount.min}
                    max={EMI_LIMITS.principalAmount.max}
                    step={10_000}
                    value={values.principalAmount}
                    sliderValue={liveInput.principalAmount}
                    onValueChange={(value) => updateValue("principalAmount", value)}
                    error={errors.principalAmount}
                    required
                    accentClassName="accent-money"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {PRINCIPAL_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("principalAmount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-money hover:text-money focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="annual-interest-rate"
                  label="Annual interest rate"
                  description="Enter the annual rate offered by the lender."
                  suffix="%"
                  min={0}
                  max={EMI_LIMITS.annualInterestRate.max}
                  step={0.05}
                  sliderMin={1}
                  sliderMax={20}
                  value={values.annualInterestRate}
                  sliderValue={liveInput.annualInterestRate}
                  onValueChange={(value) => updateValue("annualInterestRate", value)}
                  error={errors.annualInterestRate}
                  required
                  accentClassName="accent-money"
                />

                <PairedNumberSliderInput
                  id="loan-tenure"
                  label="Loan tenure"
                  description="Enter the length of the repayment period."
                  suffix={tenureIsYears ? "years" : "months"}
                  min={1}
                  max={tenureIsYears ? EMI_LIMITS.tenureYears.max : EMI_LIMITS.tenureMonths.max}
                  step={1}
                  sliderMin={tenureIsYears ? EMI_LIMITS.tenureYears.min : EMI_LIMITS.tenureMonths.min}
                  sliderMax={tenureIsYears ? EMI_LIMITS.tenureYears.max : EMI_LIMITS.tenureMonths.max}
                  value={values.tenure}
                  sliderValue={liveInput.tenure}
                  onValueChange={(value) => updateValue("tenure", value)}
                  error={errors.tenure}
                  required
                  accentClassName="accent-money"
                />

                <CalculatorSelectInput id="tenure-unit" label="Tenure unit" value={values.tenureUnit} onValueChange={(value) => updateValue("tenureUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.tenureUnit} required />

                <div className="rounded-lg border border-dashed border-line p-4 text-[13px] leading-6 text-muted-foreground">
                  EMI is calculated as <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-ink">P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)</code>, where P is principal, r is the monthly interest rate, and n is the number of monthly instalments.
                </div>

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-money-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
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

            <div className="mt-5 border-t border-line pt-5">
              <SimpleDonutChart
                title="Principal vs interest"
                items={[
                  { label: "Principal", value: result.principalAmount, formattedValue: formatIndianCurrency(result.principalAmount), colorClass: "bg-money", ringClass: "stroke-money" },
                  { label: "Interest", value: result.totalInterest, formattedValue: formatIndianCurrency(result.totalInterest), colorClass: "bg-gold", ringClass: "stroke-gold" },
                ]}
              />
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="emi" category="loans" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Repayment breakdown</p>
        <h2 id="yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Principal vs interest, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year of payments, split by what goes to principal vs interest. Hover a bar for exact figures.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartLabels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of principal versus interest paid each year of the loan"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Yearly amortization schedule" description="A year-by-year, or month-by-month, breakdown of principal, interest, and remaining balance.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setShowMonthlySchedule((value) => !value)}>{showMonthlySchedule ? "View yearly summary" : "View month-by-month"}</Button>
          </div>
          <div className="mt-4">
            {showMonthlySchedule ? (
              <DataTable caption="Monthly EMI amortization schedule" rows={monthlySchedule} columns={monthlyScheduleColumns} />
            ) : (
              <DataTable caption="Yearly EMI amortization schedule" rows={yearlySchedule} columns={yearlyScheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
