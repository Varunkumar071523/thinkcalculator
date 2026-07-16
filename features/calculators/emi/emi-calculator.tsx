"use client"

import { useEffect, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { calculateAmortizationSchedule } from "@/features/calculators/emi/calculate-amortization"
import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import { EMI_LIMITS, parseAndValidateEMIForm, type EMIFormValues } from "@/features/calculators/emi/emi-schema"
import { buildEMICalculatorUrl, EMI_DEFAULT_INPUT, parseEMIUrlState } from "@/features/calculators/emi/emi-url-state"
import type { AmortizationRow, EMIInput, EMIResult, EMIValidationErrors } from "@/features/calculators/emi/emi-types"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorResultItem } from "@/types/calculator"

function toFormValues(input: EMIInput): EMIFormValues {
  return { principalAmount: String(input.principalAmount), annualInterestRate: String(input.annualInterestRate), tenure: String(input.tenure), tenureUnit: input.tenureUnit }
}

function createResultItems(result: EMIResult): readonly CalculatorResultItem[] {
  return [
    { id: "monthly-emi", label: "Monthly EMI", value: result.monthlyEMI, displayType: "currency", isPrimary: true },
    { id: "principal", label: "Principal amount", value: result.principalAmount, displayType: "currency" },
    { id: "total-interest", label: "Total interest payable", value: result.totalInterest, displayType: "currency" },
    { id: "total-payment", label: "Total amount payable", value: result.totalPayment, displayType: "currency" },
    { id: "total-months", label: "Loan tenure in months", value: result.totalMonths, displayType: "number" },
  ]
}

const scheduleColumns: readonly DataTableColumn<AmortizationRow>[] = [
  { header: "Payment", cell: (row) => row.paymentNumber },
  { header: "Opening balance", cell: (row) => formatIndianCurrency(row.openingBalance) },
  { header: "EMI", cell: (row) => formatIndianCurrency(row.emi) },
  { header: "Principal", cell: (row) => formatIndianCurrency(row.principalPaid) },
  { header: "Interest", cell: (row) => formatIndianCurrency(row.interestPaid) },
  { header: "Closing balance", cell: (row) => formatIndianCurrency(row.closingBalance) },
  { header: "Cumulative principal", cell: (row) => formatIndianCurrency(row.cumulativePrincipal) },
  { header: "Cumulative interest", cell: (row) => formatIndianCurrency(row.cumulativeInterest) },
]

export function EMICalculator() {
  const [values, setValues] = useState<EMIFormValues>(() => toFormValues(EMI_DEFAULT_INPUT))
  const [errors, setErrors] = useState<EMIValidationErrors>({})
  const [calculation, setCalculation] = useState<{ input: EMIInput; result: EMIResult; date: string } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValues(toFormValues(parseEMIUrlState(new URLSearchParams(window.location.search))))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function updateValue(field: keyof EMIFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateEMIForm(values)
    if (!validation.success) { setErrors(validation.errors); setCalculation(null); return }
    const result = calculateEMI(validation.data)
    setErrors({})
    setCalculation({ input: validation.data, result, date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    window.history.replaceState(null, "", buildEMICalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(EMI_DEFAULT_INPUT)); setErrors({}); setCalculation(null)
    window.history.replaceState(null, "", "/finance/emi-calculator")
  }

  const result = calculation?.result ?? null
  const schedule = calculation ? calculateAmortizationSchedule(calculation.input, calculation.result) : []
  const tenureIsYears = values.tenureUnit === "years"
  const shareUrl = calculation ? buildEMICalculatorUrl(calculation.input, siteConfig.url) : ""
  const resultText = calculation ? ["ThinkCalculator EMI Calculation", "", `Loan amount: ${formatIndianCurrency(calculation.input.principalAmount)}`, `Annual interest rate: ${formatPercentage(calculation.input.annualInterestRate)}`, `Loan tenure: ${calculation.input.tenure} ${calculation.input.tenureUnit}`, `Monthly EMI: ${formatIndianCurrency(result!.monthlyEMI)}`, `Total interest: ${formatIndianCurrency(result!.totalInterest)}`, `Total repayment: ${formatIndianCurrency(result!.totalPayment)}`, "", "Calculator:", `${siteConfig.url}/finance/emi-calculator`].join("\n") : ""

  return (
    <>
      <div data-calculator-form>
        <CalculatorShell title="Calculate loan EMI" description="Enter your loan details to estimate the monthly instalment and total repayment.">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <CalculatorNumberInput id="loan-amount" label="Loan amount" description="Enter the principal amount you plan to borrow." prefix="₹" min={EMI_LIMITS.principalAmount.min} max={EMI_LIMITS.principalAmount.max} step={10_000} value={values.principalAmount} onValueChange={(value) => updateValue("principalAmount", value)} error={errors.principalAmount} required />
            <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" description="Enter the annual rate offered by the lender." suffix="%" min={0} max={EMI_LIMITS.annualInterestRate.max} step={0.1} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
            <CalculatorNumberInput id="loan-tenure" label="Loan tenure" description="Enter the length of the repayment period." suffix={tenureIsYears ? "years" : "months"} min={1} max={tenureIsYears ? EMI_LIMITS.tenureYears.max : EMI_LIMITS.tenureMonths.max} step={1} value={values.tenure} onValueChange={(value) => updateValue("tenure", value)} error={errors.tenure} required />
            <CalculatorSelectInput id="tenure-unit" label="Tenure unit" value={values.tenureUnit} onValueChange={(value) => updateValue("tenureUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.tenureUnit} required />
            <div className="flex flex-col gap-3 pt-1 sm:flex-row"><Button className="flex-1" size="lg" type="submit">Calculate EMI</Button><Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button></div>
          </form>
        </CalculatorShell>
      </div>
      <div className="space-y-6" aria-label="Calculator results">
        <CalculatorResultCard title="EMI summary" items={result ? createResultItems(result) : []} emptyTitle="Your EMI estimate will appear here" emptyDescription="Enter the loan amount, interest rate, and tenure, then select Calculate EMI." />
        {calculation && result ? <>
          <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
          <Card><CardContent><SimpleDonutChart title="Principal versus interest" items={[{ label: "Principal amount", value: result.principalAmount, formattedValue: formatIndianCurrency(result.principalAmount), colorClass: "bg-chart-1" }, { label: "Total interest", value: result.totalInterest, formattedValue: formatIndianCurrency(result.totalInterest), colorClass: "bg-chart-2" }]} /></CardContent></Card>
          <CalculationSummary title="ThinkCalculator EMI Calculation" calculationDate={calculation.date} disclaimer="This estimate is for informational purposes only. Lender calculations may differ because of rounding, fees, rate changes, and lender-specific methods." items={[{ label: "Loan amount", value: formatIndianCurrency(calculation.input.principalAmount) }, { label: "Annual interest rate", value: formatPercentage(calculation.input.annualInterestRate) }, { label: "Loan tenure", value: `${calculation.input.tenure} ${calculation.input.tenureUnit}` }, { label: "Monthly EMI", value: formatIndianCurrency(result.monthlyEMI) }, { label: "Total interest", value: formatIndianCurrency(result.totalInterest) }, { label: "Total repayment", value: formatIndianCurrency(result.totalPayment) }]} />
        </> : null}
      </div>
      {calculation ? <section className="col-span-full mt-4" data-calculation-experience aria-labelledby="amortization-heading"><h2 id="amortization-heading" className="text-2xl font-semibold tracking-tight">EMI amortization schedule</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Each row shows how a monthly payment is divided between principal and interest. Early payments generally contain a larger interest component because the outstanding balance is higher.</p><div className="mt-6"><DataTable caption="Monthly EMI amortization schedule" rows={schedule} columns={scheduleColumns} /></div><p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded to two decimal places, so visible totals may differ slightly from the full-precision calculation.</p></section> : null}
    </>
  )
}
