"use client"

import { useState, type FormEvent } from "react"

import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import {
  EMI_LIMITS,
  parseAndValidateEMIForm,
  type EMIFormValues,
} from "@/features/calculators/emi/emi-schema"
import type { EMIResult, EMIValidationErrors } from "@/features/calculators/emi/emi-types"
import type { CalculatorResultItem } from "@/types/calculator"

const defaultValues: EMIFormValues = {
  principalAmount: "2500000",
  annualInterestRate: "8.5",
  tenure: "20",
  tenureUnit: "years",
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

export function EMICalculator() {
  const [values, setValues] = useState<EMIFormValues>(defaultValues)
  const [errors, setErrors] = useState<EMIValidationErrors>({})
  const [result, setResult] = useState<EMIResult | null>(null)

  function updateValue(field: keyof EMIFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateEMIForm(values)

    if (!validation.success) {
      setErrors(validation.errors)
      setResult(null)
      return
    }

    setErrors({})
    setResult(calculateEMI(validation.data))
  }

  function handleReset() {
    setValues(defaultValues)
    setErrors({})
    setResult(null)
  }

  const tenureIsYears = values.tenureUnit === "years"

  return (
    <>
      <CalculatorShell title="Calculate loan EMI" description="Enter your loan details to estimate the monthly instalment and total repayment.">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <CalculatorNumberInput id="loan-amount" label="Loan amount" description="Enter the principal amount you plan to borrow." prefix="₹" min={EMI_LIMITS.principalAmount.min} max={EMI_LIMITS.principalAmount.max} step={10_000} value={values.principalAmount} onValueChange={(value) => updateValue("principalAmount", value)} error={errors.principalAmount} required />
          <CalculatorNumberInput id="annual-interest-rate" label="Annual interest rate" description="Enter the annual rate offered by the lender." suffix="%" min={0.1} max={EMI_LIMITS.annualInterestRate.max} step={0.1} value={values.annualInterestRate} onValueChange={(value) => updateValue("annualInterestRate", value)} error={errors.annualInterestRate} required />
          <CalculatorNumberInput id="loan-tenure" label="Loan tenure" description="Enter the length of the repayment period." suffix={tenureIsYears ? "years" : "months"} min={1} max={tenureIsYears ? EMI_LIMITS.tenureYears.max : EMI_LIMITS.tenureMonths.max} step={1} value={values.tenure} onValueChange={(value) => updateValue("tenure", value)} error={errors.tenure} required />
          <CalculatorSelectInput id="tenure-unit" label="Tenure unit" value={values.tenureUnit} onValueChange={(value) => updateValue("tenureUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.tenureUnit} required />
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button className="flex-1" size="lg" type="submit">Calculate EMI</Button>
            <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
          </div>
        </form>
      </CalculatorShell>
      <CalculatorResultCard title="EMI summary" items={result ? createResultItems(result) : []} emptyTitle="Your EMI estimate will appear here" emptyDescription="Enter the loan amount, interest rate, and tenure, then select Calculate EMI." />
    </>
  )
}
