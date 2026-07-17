"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, X } from "lucide-react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { computeHraExemption } from "@/lib/hra/engine"
import type { HraCalcInput, HraCalcResult } from "@/lib/hra/types"
import { createHraPrintDisclaimer, createHraResultText, createMetroCityListNoticeText } from "./hra-content"
import { HRA_FINANCIAL_YEAR, HRA_REGULATORY_REVIEW_DATE } from "./hra-regulatory-config"
import { HRA_DEFAULT_FORM_VALUES, HRA_LIMITS, parseAndValidateHraForm } from "./hra-schema"
import type { HraFormErrors, HraFormValues } from "./hra-types"
import { buildHraCalculatorUrl, buildIncomeTaxPassThroughUrl, parseHraUrlState, parseValidHraUrlState } from "./hra-url-state"
import { HraBindingConstraintCard, HraResultSummary, describeBindingConstraint } from "./hra-results"

const cityOptions = [
  { label: "Metro (Delhi, Mumbai, Kolkata, Chennai)", value: "metro" },
  { label: "Non-metro", value: "non-metro" },
]

function MetroCityListNotice({ onDismiss }: { readonly onDismiss: () => void }) {
  return (
    <div
      role="status"
      data-testid="metro-city-list-notice"
      className="mb-5 flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-4 text-sm leading-6"
    >
      <p>{createMetroCityListNoticeText()}</p>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={onDismiss}>
        <X aria-hidden="true" />
      </Button>
    </div>
  )
}

export function HraCalculator() {
  const [values, setValues] = useState<HraFormValues>(HRA_DEFAULT_FORM_VALUES)
  const [errors, setErrors] = useState<HraFormErrors>({})
  const [calculation, setCalculation] = useState<{ input: HraCalcInput; result: HraCalcResult; date: string } | null>(null)
  const [metroNoticeDismissed, setMetroNoticeDismissed] = useState(false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    const parsed = parseHraUrlState(search)
    const sharedInput = parseValidHraUrlState(search)
    setValues(parsed)
    if (sharedInput) {
      setCalculation({
        input: sharedInput,
        result: computeHraExemption(sharedInput, HRA_FINANCIAL_YEAR),
        date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
      })
    }
  })

  function update(field: keyof HraFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setCalculation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateHraForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setCalculation(null)
      return
    }
    const result = computeHraExemption(validation.data, HRA_FINANCIAL_YEAR)
    setErrors({})
    setCalculation({ input: validation.data, result, date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    window.history.replaceState(null, "", buildHraCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(HRA_DEFAULT_FORM_VALUES)
    setErrors({})
    setCalculation(null)
    window.history.replaceState(null, "", "/finance/hra-calculator")
  }

  const shareUrl = calculation ? buildHraCalculatorUrl(calculation.input, siteConfig.url) : ""
  const resultText = calculation ? createHraResultText(calculation.result) : ""

  return (
    <>
      <div data-calculator-form>
        {!metroNoticeDismissed ? <MetroCityListNotice onDismiss={() => setMetroNoticeDismissed(true)} /> : null}
        <CalculatorShell title="Calculate HRA exemption" description="Enter your salary, HRA received, rent paid, and city to see your Section 10(13A) exemption.">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <CalculatorNumberInput
              id="basic-salary"
              label="Basic salary (annual)"
              description="Enter your total annual basic salary."
              prefix="₹"
              min={HRA_LIMITS.amount.min}
              max={HRA_LIMITS.amount.max}
              step={1_000}
              value={values.basicSalary}
              onValueChange={(value) => update("basicSalary", value)}
              error={errors.basicSalary}
              required
            />
            <CalculatorNumberInput
              id="da"
              label="DA (annual)"
              description="Dearness allowance forming part of retirement benefits. Leave at 0 if not applicable."
              prefix="₹"
              min={HRA_LIMITS.amount.min}
              max={HRA_LIMITS.amount.max}
              step={1_000}
              value={values.da}
              onValueChange={(value) => update("da", value)}
              error={errors.da}
            />
            <CalculatorNumberInput
              id="hra-received"
              label="HRA received (annual)"
              description="Enter the total HRA you received from your employer for the year."
              prefix="₹"
              min={HRA_LIMITS.amount.min}
              max={HRA_LIMITS.amount.max}
              step={1_000}
              value={values.hraReceived}
              onValueChange={(value) => update("hraReceived", value)}
              error={errors.hraReceived}
              required
            />
            <CalculatorNumberInput
              id="rent-paid"
              label="Rent paid (annual)"
              description="Enter the total rent you paid for the year."
              prefix="₹"
              min={HRA_LIMITS.amount.min}
              max={HRA_LIMITS.amount.max}
              step={1_000}
              value={values.rentPaid}
              onValueChange={(value) => update("rentPaid", value)}
              error={errors.rentPaid}
              required
            />
            <CalculatorSelectInput
              id="city"
              label="City"
              description="Metro: Delhi, Mumbai, Kolkata, Chennai. All other cities are non-metro."
              value={values.city}
              onValueChange={(value) => update("city", value)}
              options={cityOptions}
              error={errors.city}
              required
            />
            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
              <strong>Narrow scope:</strong> this exemption applies only under the old tax regime and uses whole-year figures for FY {HRA_FINANCIAL_YEAR}. Verify against official sources or consult a qualified professional before filing.
            </div>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Button className="flex-1" size="lg" type="submit">Calculate HRA exemption</Button>
              <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
            </div>
          </form>
        </CalculatorShell>
      </div>

      <div className="space-y-6" aria-label="Calculator results">
        <HraResultSummary result={calculation?.result ?? null} />
        {calculation ? (
          <>
            <HraBindingConstraintCard result={calculation.result} />
            <Button
              className="w-full"
              size="lg"
              nativeButton={false}
              render={<Link href={buildIncomeTaxPassThroughUrl(calculation.result.exemptHra)} />}
            >
              Use this in the Income Tax Calculator <ArrowRight aria-hidden="true" />
            </Button>
            <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            <CalculationSummary
              title="ThinkCalculator HRA Exemption Calculation"
              calculationDate={calculation.date}
              disclaimer={createHraPrintDisclaimer()}
              items={[
                { label: "Financial year", value: `${calculation.result.financialYear} (AY ${calculation.result.assessmentYear})` },
                { label: "City", value: calculation.input.city === "metro" ? "Metro" : "Non-metro" },
                { label: "Salary (basic + DA)", value: formatIndianCurrency(calculation.result.salary) },
                { label: "HRA received", value: formatIndianCurrency(calculation.input.hraReceived) },
                { label: "Rent paid", value: formatIndianCurrency(calculation.input.rentPaid) },
                { label: "Actual HRA received", value: formatIndianCurrency(calculation.result.actualHraReceived) },
                { label: "Rent paid minus 10% of salary", value: formatIndianCurrency(calculation.result.rentMinusTenPercentSalary) },
                { label: `${calculation.result.percentOfSalaryRate * 100}% of salary`, value: formatIndianCurrency(calculation.result.percentOfSalary) },
                { label: "Binding constraint", value: describeBindingConstraint(calculation.result) },
                { label: "Exempt HRA", value: formatIndianCurrency(calculation.result.exemptHra) },
                { label: "Taxable HRA", value: formatIndianCurrency(calculation.result.taxableHra) },
                { label: "Regulatory review date", value: HRA_REGULATORY_REVIEW_DATE },
              ]}
            />
          </>
        ) : null}
      </div>
    </>
  )
}
