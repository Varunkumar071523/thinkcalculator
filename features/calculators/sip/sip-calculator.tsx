"use client"

import { useState, type FormEvent } from "react"

import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { calculateSIP } from "@/features/calculators/sip/calculate-sip"
import { parseAndValidateSIPForm, SIP_LIMITS, type SIPFormValues } from "@/features/calculators/sip/sip-schema"
import type { SIPResult, SIPValidationErrors } from "@/features/calculators/sip/sip-types"
import type { CalculatorResultItem } from "@/types/calculator"

const defaultValues: SIPFormValues = {
  monthlyInvestment: "10000",
  annualReturnRate: "12",
  duration: "10",
  durationUnit: "years",
}

function createResultItems(result: SIPResult): readonly CalculatorResultItem[] {
  return [
    { id: "future-value", label: "Estimated future value", value: result.futureValue, displayType: "currency", description: "An estimate based on the return rate entered, not a guaranteed outcome.", isPrimary: true },
    { id: "total-invested", label: "Total invested amount", value: result.totalInvested, displayType: "currency" },
    { id: "estimated-returns", label: "Estimated returns", value: result.estimatedReturns, displayType: "currency" },
    { id: "monthly-investment", label: "Monthly investment", value: result.monthlyInvestment, displayType: "currency" },
    { id: "total-months", label: "Investment duration in months", value: result.totalMonths, displayType: "number" },
  ]
}

export function SIPCalculator() {
  const [values, setValues] = useState<SIPFormValues>(defaultValues)
  const [errors, setErrors] = useState<SIPValidationErrors>({})
  const [result, setResult] = useState<SIPResult | null>(null)

  function updateValue(field: keyof SIPFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateSIPForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setResult(null)
      return
    }

    setErrors({})
    setResult(calculateSIP(validation.data))
  }

  function handleReset() {
    setValues(defaultValues)
    setErrors({})
    setResult(null)
  }

  const durationIsYears = values.durationUnit === "years"

  return (
    <>
      <CalculatorShell title="Calculate SIP value" description="Enter a monthly contribution and an assumed return to estimate a future value.">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <CalculatorNumberInput id="monthly-investment" label="Monthly investment" description="Enter the amount you plan to invest each month." prefix="₹" min={SIP_LIMITS.monthlyInvestment.min} max={SIP_LIMITS.monthlyInvestment.max} step={500} value={values.monthlyInvestment} onValueChange={(value) => updateValue("monthlyInvestment", value)} error={errors.monthlyInvestment} required />
          <CalculatorNumberInput id="annual-return-rate" label="Expected annual return" description="This is an assumption; actual market returns may be higher or lower." suffix="%" min={SIP_LIMITS.annualReturnRate.min} max={SIP_LIMITS.annualReturnRate.max} step={0.1} value={values.annualReturnRate} onValueChange={(value) => updateValue("annualReturnRate", value)} error={errors.annualReturnRate} required />
          <CalculatorNumberInput id="investment-duration" label="Investment duration" description="Enter how long you plan to make monthly contributions." suffix={durationIsYears ? "years" : "months"} min={1} max={durationIsYears ? SIP_LIMITS.durationYears.max : SIP_LIMITS.durationMonths.max} step={1} value={values.duration} onValueChange={(value) => updateValue("duration", value)} error={errors.duration} required />
          <CalculatorSelectInput id="duration-unit" label="Duration unit" value={values.durationUnit} onValueChange={(value) => updateValue("durationUnit", value)} options={[{ label: "Years", value: "years" }, { label: "Months", value: "months" }]} error={errors.durationUnit} required />
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button className="flex-1" size="lg" type="submit">Calculate SIP</Button>
            <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
          </div>
        </form>
      </CalculatorShell>
      <CalculatorResultCard title="SIP estimate" items={result ? createResultItems(result) : []} emptyTitle="Your SIP estimate will appear here" emptyDescription="Enter the contribution, expected return, and duration, then select Calculate SIP." />
    </>
  )
}
