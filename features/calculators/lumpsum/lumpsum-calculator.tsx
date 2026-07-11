"use client"

import { useState, type FormEvent } from "react"

import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { calculateLumpsum } from "@/features/calculators/lumpsum/calculate-lumpsum"
import { LUMPSUM_LIMITS, parseAndValidateLumpsumForm, type LumpsumFormValues } from "@/features/calculators/lumpsum/lumpsum-schema"
import type { LumpsumResult, LumpsumValidationErrors } from "@/features/calculators/lumpsum/lumpsum-types"
import type { CalculatorResultItem } from "@/types/calculator"

const defaultValues: LumpsumFormValues = {
  initialInvestment: "100000",
  annualReturnRate: "12",
  duration: "10",
  durationUnit: "years",
}

function createResultItems(result: LumpsumResult): readonly CalculatorResultItem[] {
  return [
    { id: "future-value", label: "Estimated future value", value: result.futureValue, displayType: "currency", description: "An estimate based on the return rate entered, not a guaranteed outcome.", isPrimary: true },
    { id: "initial-investment", label: "Initial investment", value: result.initialInvestment, displayType: "currency" },
    { id: "estimated-returns", label: "Estimated returns", value: result.estimatedReturns, displayType: "currency" },
    { id: "annual-return", label: "Annual return entered", value: result.annualRate * 100, displayType: "percentage" },
    { id: "total-months", label: "Investment duration in months", value: result.totalMonths, displayType: "number" },
  ]
}

export function LumpsumCalculator() {
  const [values, setValues] = useState<LumpsumFormValues>(defaultValues)
  const [errors, setErrors] = useState<LumpsumValidationErrors>({})
  const [result, setResult] = useState<LumpsumResult | null>(null)

  function updateValue(field: keyof LumpsumFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateLumpsumForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setResult(null)
      return
    }

    setErrors({})
    setResult(calculateLumpsum(validation.data))
  }

  function handleReset() {
    setValues(defaultValues)
    setErrors({})
    setResult(null)
  }

  const durationIsYears = values.durationUnit === "years"

  return (
    <>
      <CalculatorShell title="Calculate lumpsum value" description="Enter a one-time investment and an assumed return to estimate its future value.">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <CalculatorNumberInput id="initial-investment" label="Initial investment" description="Enter the one-time amount you plan to invest." prefix="₹" min={LUMPSUM_LIMITS.initialInvestment.min} max={LUMPSUM_LIMITS.initialInvestment.max} step={1_000} value={values.initialInvestment} onValueChange={(value) => updateValue("initialInvestment", value)} error={errors.initialInvestment} required />
          <CalculatorNumberInput id="annual-return-rate" label="Expected annual return" description="This is an assumption; actual market returns may be higher or lower." suffix="%" min={LUMPSUM_LIMITS.annualReturnRate.min} max={LUMPSUM_LIMITS.annualReturnRate.max} step={0.1} value={values.annualReturnRate} onValueChange={(value) => updateValue("annualReturnRate", value)} error={errors.annualReturnRate} required />
          <CalculatorNumberInput id="investment-duration" label="Investment duration" description="Enter how long the amount may remain invested." suffix={durationIsYears ? "years" : "months"} min={1} max={durationIsYears ? LUMPSUM_LIMITS.durationYears.max : LUMPSUM_LIMITS.durationMonths.max} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
          <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button className="flex-1" size="lg" type="submit">Calculate value</Button>
            <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
          </div>
        </form>
      </CalculatorShell>
      <CalculatorResultCard title="Lumpsum estimate" items={result ? createResultItems(result) : []} emptyTitle="Your investment estimate will appear here" emptyDescription="Enter the investment, expected return, and duration, then select Calculate value." />
    </>
  )
}
