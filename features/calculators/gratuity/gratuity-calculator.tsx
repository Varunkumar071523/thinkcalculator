"use client"

import { useState, type FormEvent } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatorResultCard, CalculatorShell } from "@/features/calculators/core"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorResultItem } from "@/types/calculator"
import { calculateGratuity } from "./calculate-gratuity"
import {
  createGratuityPrintDisclaimer,
  createGratuityOrdinaryServiceText,
  createGratuityResultText,
  hasOrdinaryGratuityService,
} from "./gratuity-content"
import {
  GRATUITY_ORDINARY_SERVICE_YEARS,
  GRATUITY_REGULATORY_REVIEW_DATE,
} from "./gratuity-regulatory-config"
import {
  GRATUITY_LIMITS,
  parseAndValidateGratuityForm,
  type GratuityFormValues,
} from "./gratuity-schema"
import type {
  GratuityInput,
  GratuityResult,
  GratuityValidationErrors,
} from "./gratuity-types"
import {
  buildGratuityCalculatorUrl,
  GRATUITY_DEFAULT_INPUT,
  parseGratuityUrlState,
  parseValidGratuityUrlState,
} from "./gratuity-url-state"

function toFormValues(input: GratuityInput): GratuityFormValues {
  return {
    eligibleMonthlyWages: String(input.eligibleMonthlyWages),
    completedYears: String(input.completedYears),
    additionalMonths: String(input.additionalMonths),
  }
}

export function createGratuityResultItems(result: GratuityResult): readonly CalculatorResultItem[] {
  return [
    { id: "estimated", label: "Estimated gratuity after ceiling", value: result.estimatedGratuity, displayType: "currency", isPrimary: true },
    { id: "before-ceiling", label: "Gratuity before statutory ceiling", value: result.gratuityBeforeCeiling, displayType: "currency" },
    { id: "counted-service", label: "Counted service", value: `${formatIndianNumber(result.countedServiceYears)} years`, displayType: "text" },
    { id: "daily-wage", label: "Daily wage basis", value: result.dailyWageBasis, displayType: "currency" },
    { id: "ceiling-status", label: "Ceiling status", value: result.ceilingApplied ? "Applied" : "Not applied", displayType: "text" },
  ]
}

export function GratuityCalculator() {
  const [values, setValues] = useState<GratuityFormValues>(() => toFormValues(GRATUITY_DEFAULT_INPUT))
  const [errors, setErrors] = useState<GratuityValidationErrors>({})
  const [calculation, setCalculation] = useState<{ input: GratuityInput; result: GratuityResult; date: string } | null>(null)

  const markInteracted = useCalculatorUrlRestore((search) => {
    const parsed = parseGratuityUrlState(search)
    const sharedInput = parseValidGratuityUrlState(search)
    setValues(toFormValues(parsed))
    if (sharedInput) {
      setCalculation({
        input: sharedInput,
        result: calculateGratuity(sharedInput),
        date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
      })
    }
  })

  function update(field: keyof GratuityFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setCalculation(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateGratuityForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setCalculation(null)
      return
    }

    const result = calculateGratuity(validation.data)
    setErrors({})
    setCalculation({
      input: validation.data,
      result,
      date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
    })
    window.history.replaceState(null, "", buildGratuityCalculatorUrl(validation.data))
  }

  function reset() {
    setValues(toFormValues(GRATUITY_DEFAULT_INPUT))
    setErrors({})
    setCalculation(null)
    window.history.replaceState(null, "", "/finance/gratuity-calculator")
  }

  const shareUrl = calculation ? buildGratuityCalculatorUrl(calculation.input, siteConfig.url) : ""
  const resultText = calculation ? createGratuityResultText(calculation.input, calculation.result) : ""
  const ordinaryServiceMet = calculation ? hasOrdinaryGratuityService(calculation.input) : false

  return (
    <>
      <div data-calculator-form>
        <CalculatorShell title="Estimate gratuity" description="Enter the eligible last-drawn wage basis and completed service for the standard monthly rated employee calculation.">
          <form className="space-y-5" onSubmit={submit} noValidate>
            <CalculatorNumberInput
              id="eligible-monthly-wages"
              label="Eligible monthly wages"
              description="Enter the last-drawn wage amount determined under section 2(88) of the Code on Social Security, 2020. This is not necessarily gross salary or CTC; payroll may need to apply included components, exclusions, and the 50% rule."
              prefix="₹"
              min={GRATUITY_LIMITS.eligibleMonthlyWages.min}
              max={GRATUITY_LIMITS.eligibleMonthlyWages.max}
              step={0.01}
              value={values.eligibleMonthlyWages}
              onValueChange={(value) => update("eligibleMonthlyWages", value)}
              error={errors.eligibleMonthlyWages}
              required
            />
            <CalculatorNumberInput
              id="completed-years"
              label="Completed years of service"
              description="Enter only fully completed years, from 0 to 60."
              suffix="years"
              min={GRATUITY_LIMITS.completedYears.min}
              max={GRATUITY_LIMITS.completedYears.max}
              step={1}
              value={values.completedYears}
              onValueChange={(value) => update("completedYears", value)}
              error={errors.completedYears}
              required
            />
            <CalculatorNumberInput
              id="additional-months"
              label="Additional completed months"
              description="Enter 0 to 11. Exactly 6 months does not add a counted year; 7 to 11 months adds one under the standard formula."
              suffix="months"
              min={GRATUITY_LIMITS.additionalMonths.min}
              max={GRATUITY_LIMITS.additionalMonths.max}
              step={1}
              value={values.additionalMonths}
              onValueChange={(value) => update("additionalMonths", value)}
              error={errors.additionalMonths}
              required
            />
            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
              <strong>Narrow scope:</strong> this estimates the standard amount for a regular monthly rated employee. It does not decide coverage, continuous service, termination-event eligibility, fixed-term or other special cases, better contractual terms, or forfeiture.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" size="lg" type="submit">Calculate gratuity</Button>
              <Button className="flex-1" size="lg" variant="outline" type="button" onClick={reset}>Reset</Button>
            </div>
          </form>
        </CalculatorShell>
      </div>

      <div className="space-y-6">
        <CalculatorResultCard
          title="Gratuity estimate"
          items={calculation ? createGratuityResultItems(calculation.result) : []}
          emptyTitle="Your gratuity estimate will appear here"
          emptyDescription="Enter eligible monthly wages and completed service, then select Calculate gratuity."
        />
        {calculation ? (
          <>
            <Card role="status" aria-live="polite" className={ordinaryServiceMet ? "border-border" : "border-amber-600/50"}>
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-lg">
                  {ordinaryServiceMet ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />}
                  Ordinary service threshold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {ordinaryServiceMet
                    ? `The input includes at least ${GRATUITY_ORDINARY_SERVICE_YEARS} completed years, matching the ordinary minimum-service threshold. This still does not establish legal eligibility.`
                    : `The input is below ${GRATUITY_ORDINARY_SERVICE_YEARS} completed years, so the ordinary minimum-service rule may not be met. Death, disablement, fixed-term employment, working-journalist treatment, and notified events can follow different rules; this calculator does not decide them.`}
                </p>
              </CardContent>
            </Card>
            <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            <Card>
              <CardHeader><CardTitle className="text-lg">How service was counted</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>You entered {calculation.input.completedYears} completed years and {calculation.input.additionalMonths} additional completed months.</p>
                <p>The standard formula counts {formatIndianNumber(calculation.result.countedServiceYears)} years because {calculation.input.additionalMonths > 6 ? "the additional months are in excess of six" : "the additional months are not in excess of six"}.</p>
                <p>{calculation.result.ceilingApplied ? `The formula amount exceeded the statutory ceiling, reducing the displayed estimate by ${formatIndianCurrency(calculation.result.ceilingAdjustment)}.` : `The formula amount is below the ${formatIndianCurrency(calculation.result.statutoryCeiling)} statutory ceiling, so no ceiling adjustment was applied.`}</p>
              </CardContent>
            </Card>
            <CalculationSummary
              title="ThinkCalculator Gratuity Estimate"
              calculationDate={calculation.date}
              disclaimer={createGratuityPrintDisclaimer()}
              items={[
                { label: "Eligible monthly wages entered", value: formatIndianCurrency(calculation.input.eligibleMonthlyWages) },
                { label: "Completed service entered", value: `${calculation.input.completedYears} years ${calculation.input.additionalMonths} months` },
                { label: "Counted service for standard formula", value: `${formatIndianNumber(calculation.result.countedServiceYears)} years` },
                { label: "Daily wage basis", value: formatIndianCurrency(calculation.result.dailyWageBasis) },
                { label: "Gratuity before statutory ceiling", value: formatIndianCurrency(calculation.result.gratuityBeforeCeiling) },
                { label: "Statutory ceiling used", value: formatIndianCurrency(calculation.result.statutoryCeiling) },
                { label: "Estimated gratuity after ceiling", value: formatIndianCurrency(calculation.result.estimatedGratuity) },
                { label: "Ceiling status", value: calculation.result.ceilingApplied ? "Applied" : "Not applied" },
                { label: "Ordinary service threshold", value: createGratuityOrdinaryServiceText(calculation.input) },
                { label: "Regulatory review date", value: GRATUITY_REGULATORY_REVIEW_DATE },
              ]}
            />
          </>
        ) : null}
      </div>
    </>
  )
}
