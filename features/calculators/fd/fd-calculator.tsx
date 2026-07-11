"use client"

import { useState, type FormEvent } from "react"

import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { calculateFD } from "@/features/calculators/fd/calculate-fd"
import { FD_LIMITS, parseAndValidateFDForm, type FDFormValues } from "@/features/calculators/fd/fd-schema"
import type { FDResult, FDValidationErrors } from "@/features/calculators/fd/fd-types"
import type { CalculatorResultItem } from "@/types/calculator"

const defaultValues: FDFormValues = {
  principalAmount: "100000",
  annualInterestRate: "7",
  duration: "5",
  durationUnit: "years",
  compoundingFrequency: "quarterly",
}

const frequencyLabels = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-yearly",
  yearly: "Yearly",
} as const

function createResultItems(result: FDResult): readonly CalculatorResultItem[] {
  return [
    { id: "maturity-amount", label: "Maturity amount", value: result.maturityAmount, displayType: "currency", description: "An estimate before taxes, TDS, penalties, or bank-specific adjustments.", isPrimary: true },
    { id: "principal", label: "Principal amount", value: result.principalAmount, displayType: "currency" },
    { id: "interest-earned", label: "Interest earned", value: result.interestEarned, displayType: "currency" },
    { id: "annual-interest", label: "Annual interest rate", value: result.annualInterestRate, displayType: "percentage" },
    { id: "total-months", label: "Duration in months", value: result.totalMonths, displayType: "number" },
    { id: "compounding", label: "Compounding frequency", value: frequencyLabels[result.compoundingFrequency], displayType: "text" },
  ]
}

export function FDCalculator() {
  const [values, setValues] = useState<FDFormValues>(defaultValues)
  const [errors, setErrors] = useState<FDValidationErrors>({})
  const [result, setResult] = useState<FDResult | null>(null)

  function updateValue(field: keyof FDFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateFDForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setResult(null)
      return
    }

    setErrors({})
    setResult(calculateFD(validation.data))
  }

  function handleReset() {
    setValues(defaultValues)
    setErrors({})
    setResult(null)
  }

  const durationIsYears = values.durationUnit === "years"

  return (
    <>
      <CalculatorShell title="Calculate FD maturity" description="Enter the deposit terms to estimate maturity amount and interest earned.">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <CalculatorNumberInput id="deposit-amount" label="Deposit amount" description="Enter the principal amount placed in the fixed deposit." prefix="₹" min={FD_LIMITS.principalAmount.min} max={FD_LIMITS.principalAmount.max} step={1_000} value={values.principalAmount} onValueChange={(value) => updateValue("principalAmount", value)} error={errors.principalAmount} required />
          <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" description="Enter the annual rate offered for the deposit." suffix="%" min={FD_LIMITS.annualInterestRate.min} max={FD_LIMITS.annualInterestRate.max} step={0.01} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
          <CalculatorNumberInput id="deposit-duration" label="Deposit duration" description="Enter how long the deposit will remain invested." suffix={durationIsYears ? "years" : "months"} min={1} max={durationIsYears ? FD_LIMITS.durationYears.max : FD_LIMITS.durationMonths.max} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
          <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
          <CalculatorSelectInput id="compounding-frequency" label="Compounding frequency" description="Choose how often interest is added to the deposit." value={values.compoundingFrequency} onValueChange={(value) => updateValue("compoundingFrequency", value)} options={[{ label: "Monthly", value: "monthly" }, { label: "Quarterly", value: "quarterly" }, { label: "Half-yearly", value: "half-yearly" }, { label: "Yearly", value: "yearly" }]} error={errors.compoundingFrequency} required />
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button className="flex-1" size="lg" type="submit">Calculate FD</Button>
            <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
          </div>
        </form>
      </CalculatorShell>
      <CalculatorResultCard title="FD estimate" items={result ? createResultItems(result) : []} emptyTitle="Your FD estimate will appear here" emptyDescription="Enter the deposit amount, rate, duration, and compounding frequency, then select Calculate FD." />
    </>
  )
}
