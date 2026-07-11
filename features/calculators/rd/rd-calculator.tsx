"use client"

import { useState, type FormEvent } from "react"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard, CalculatorShell } from "@/features/calculators/core"
import { calculateRD } from "@/features/calculators/rd/calculate-rd"
import { parseAndValidateRDForm, RD_LIMITS, type RDFormValues } from "@/features/calculators/rd/rd-schema"
import type { RDResult, RDValidationErrors } from "@/features/calculators/rd/rd-types"
import type { CalculatorResultItem } from "@/types/calculator"

const defaultValues: RDFormValues = { monthlyDeposit: "5000", annualInterestRate: "7", duration: "5", durationUnit: "years", compoundingFrequency: "quarterly" }
const frequencyLabels = { monthly: "Monthly", quarterly: "Quarterly", "half-yearly": "Half-yearly", yearly: "Yearly" } as const

function createResultItems(result: RDResult): readonly CalculatorResultItem[] {
  return [
    { id: "maturity", label: "Maturity amount", value: result.maturityAmount, displayType: "currency", description: "Estimated before taxes, TDS, penalties, and bank-specific adjustments.", isPrimary: true },
    { id: "deposited", label: "Total deposited amount", value: result.totalDeposited, displayType: "currency" },
    { id: "interest", label: "Interest earned", value: result.interestEarned, displayType: "currency" },
    { id: "monthly-deposit", label: "Monthly deposit", value: result.monthlyDeposit, displayType: "currency" },
    { id: "rate", label: "Annual interest rate", value: result.annualInterestRate, displayType: "percentage" },
    { id: "months", label: "Duration in months", value: result.totalMonths, displayType: "number" },
    { id: "frequency", label: "Compounding frequency", value: frequencyLabels[result.compoundingFrequency], displayType: "text" },
  ]
}

export function RDCalculator() {
  const [values, setValues] = useState<RDFormValues>(defaultValues)
  const [errors, setErrors] = useState<RDValidationErrors>({})
  const [result, setResult] = useState<RDResult | null>(null)
  function updateValue(field: keyof RDFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateRDForm(values)
    if (!validation.success) { setErrors(validation.errors); setResult(null); return }
    setErrors({}); setResult(calculateRD(validation.data))
  }
  function handleReset() { setValues(defaultValues); setErrors({}); setResult(null) }
  const durationSuffix = values.durationUnit === "months" ? "months" : "years"

  return <>
    <CalculatorShell title="Calculate RD maturity" description="Enter the recurring deposit terms to estimate maturity amount and interest earned.">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <CalculatorNumberInput id="monthly-deposit" label="Monthly deposit" description="Amount deposited at the beginning of each month." prefix="₹" min={RD_LIMITS.monthlyDeposit.min} max={RD_LIMITS.monthlyDeposit.max} step={100} value={values.monthlyDeposit} onValueChange={(value) => updateValue("monthlyDeposit", value)} error={errors.monthlyDeposit} required />
        <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" suffix="%" min={0} max={20} step={0.01} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
        <CalculatorNumberInput id="deposit-duration" label="Deposit duration" suffix={durationSuffix} min={1} max={20} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
        <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
        <CalculatorSelectInput id="compounding-frequency" label="Compounding frequency" value={values.compoundingFrequency} onValueChange={(value) => updateValue("compoundingFrequency", value)} options={[{ label: "Monthly", value: "monthly" }, { label: "Quarterly", value: "quarterly" }, { label: "Half-yearly", value: "half-yearly" }, { label: "Yearly", value: "yearly" }]} error={errors.compoundingFrequency} required />
        <div className="flex flex-col gap-3 pt-1 sm:flex-row"><Button className="flex-1" size="lg" type="submit">Calculate RD</Button><Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button></div>
      </form>
    </CalculatorShell>
    <CalculatorResultCard title="RD estimate" items={result ? createResultItems(result) : []} emptyTitle="Your RD estimate will appear here" emptyDescription="Enter the monthly deposit, rate, duration, and compounding frequency, then select Calculate RD." />
  </>
}
