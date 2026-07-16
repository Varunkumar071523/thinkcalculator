"use client"

import { useEffect, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatorResultCard, CalculatorShell } from "@/features/calculators/core"
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorResultItem } from "@/types/calculator"
import { calculateCAGR } from "./calculate-cagr"
import { CAGR_LIMITS, parseAndValidateCAGRForm, type CAGRFormValues } from "./cagr-schema"
import { buildCAGRCalculatorUrl, CAGR_DEFAULT_INPUT, parseCAGRUrlState, parseValidCAGRUrlState } from "./cagr-url-state"
import type { CAGRInput, CAGRResult, CAGRValidationErrors } from "./cagr-types"

function toFormValues(input: CAGRInput): CAGRFormValues {
  return {
    beginningValue: String(input.beginningValue),
    endingValue: String(input.endingValue),
    investmentPeriodYears: String(input.investmentPeriodYears),
  }
}

export function normaliseCAGRDisplayZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
}

const scientificPercentageFormatter = new Intl.NumberFormat("en-IN", {
  notation: "scientific",
  maximumFractionDigits: 2,
})

export function formatCAGRPercentageForDisplay(value: number): string {
  const normalised = normaliseCAGRDisplayZero(value)
  return Math.abs(normalised) >= 1_000_000_000_000
    ? `${scientificPercentageFormatter.format(normalised)}%`
    : formatPercentage(normalised)
}

export function getCAGRGainLossLabel(result: CAGRResult): "Absolute gain" | "Absolute loss" {
  return result.absoluteGainLoss < 0 ? "Absolute loss" : "Absolute gain"
}

export function createCAGRResultItems(result: CAGRResult): readonly CalculatorResultItem[] {
  return [
    { id: "cagr", label: "Compound annual growth rate", value: formatCAGRPercentageForDisplay(result.cagrPercentage), displayType: "text", isPrimary: true },
    { id: "gain-loss", label: getCAGRGainLossLabel(result), value: normaliseCAGRDisplayZero(result.absoluteGainLoss), displayType: "currency" },
    { id: "total-return", label: "Total return", value: normaliseCAGRDisplayZero(result.totalReturnPercentage), displayType: "percentage" },
    { id: "growth-multiple", label: "Growth multiple", value: `${formatIndianNumber(normaliseCAGRDisplayZero(result.growthMultiple))}×`, displayType: "text" },
  ]
}

export function createCAGRResultText(input: CAGRInput, result: CAGRResult): string {
  return [
    "ThinkCalculator CAGR Calculation",
    "",
    `Beginning value: ${formatIndianCurrency(input.beginningValue)}`,
    `Ending value: ${formatIndianCurrency(input.endingValue)}`,
    `Investment period: ${formatIndianNumber(input.investmentPeriodYears)} years`,
    `CAGR: ${formatCAGRPercentageForDisplay(result.cagrPercentage)}`,
    `${getCAGRGainLossLabel(result)}: ${formatIndianCurrency(normaliseCAGRDisplayZero(result.absoluteGainLoss))}`,
    `Total return: ${formatPercentage(normaliseCAGRDisplayZero(result.totalReturnPercentage))}`,
    `Growth multiple: ${formatIndianNumber(normaliseCAGRDisplayZero(result.growthMultiple))}×`,
    "",
    "Calculator:",
    `${siteConfig.url}/finance/cagr-calculator`,
  ].join("\n")
}

export function CAGRCalculator() {
  const [values, setValues] = useState<CAGRFormValues>(() => toFormValues(CAGR_DEFAULT_INPUT))
  const [errors, setErrors] = useState<CAGRValidationErrors>({})
  const [calculation, setCalculation] = useState<{ input: CAGRInput; result: CAGRResult; date: string } | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const search = new URLSearchParams(window.location.search)
      const parsed = parseCAGRUrlState(search)
      const sharedInput = parseValidCAGRUrlState(search)
      setValues(toFormValues(parsed))
      if (sharedInput) {
        setCalculation({
          input: sharedInput,
          result: calculateCAGR(sharedInput),
          date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
        })
      }
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [])

  function update(field: keyof CAGRFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateCAGRForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setCalculation(null)
      return
    }

    const result = calculateCAGR(validation.data)
    setErrors({})
    setCalculation({
      input: validation.data,
      result,
      date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
    })
    window.history.replaceState(null, "", buildCAGRCalculatorUrl(validation.data))
  }

  function reset() {
    setValues(toFormValues(CAGR_DEFAULT_INPUT))
    setErrors({})
    setCalculation(null)
    window.history.replaceState(null, "", "/finance/cagr-calculator")
  }

  const shareUrl = calculation ? buildCAGRCalculatorUrl(calculation.input, siteConfig.url) : ""
  const gainLossLabel = calculation ? getCAGRGainLossLabel(calculation.result) : "Absolute gain"
  const resultText = calculation ? createCAGRResultText(calculation.input, calculation.result) : ""

  return (
    <>
      <div data-calculator-form>
        <CalculatorShell title="Calculate CAGR" description="Enter two endpoint values and the elapsed period to calculate annualised compound growth.">
          <form className="space-y-5" onSubmit={submit} noValidate>
            <CalculatorNumberInput id="beginning-value" label="Beginning value" prefix="₹" min={CAGR_LIMITS.beginningValue.min} max={CAGR_LIMITS.beginningValue.max} step={0.01} value={values.beginningValue} onValueChange={(value) => update("beginningValue", value)} error={errors.beginningValue} required />
            <CalculatorNumberInput id="ending-value" label="Ending value" prefix="₹" min={CAGR_LIMITS.endingValue.min} max={CAGR_LIMITS.endingValue.max} step={0.01} value={values.endingValue} onValueChange={(value) => update("endingValue", value)} error={errors.endingValue} required />
            <CalculatorNumberInput id="investment-period" label="Investment period" description="Enter years from 0.01 to 100, with up to two decimal places." suffix="years" min={CAGR_LIMITS.investmentPeriodYears.min} max={CAGR_LIMITS.investmentPeriodYears.max} step={0.01} value={values.investmentPeriodYears} onValueChange={(value) => update("investmentPeriodYears", value)} error={errors.investmentPeriodYears} required />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" size="lg" type="submit">Calculate CAGR</Button>
              <Button className="flex-1" size="lg" variant="outline" type="button" onClick={reset}>Reset</Button>
            </div>
          </form>
        </CalculatorShell>
      </div>

      <div className="space-y-6">
        <CalculatorResultCard title="CAGR result" items={calculation ? createCAGRResultItems(calculation.result) : []} emptyTitle="Your CAGR result will appear here" emptyDescription="Enter the beginning value, ending value, and period, then select Calculate CAGR." />
        {calculation ? (
          <>
            <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            <Card>
              <CardHeader><CardTitle className="text-lg">Beginning versus ending value</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Beginning value</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(calculation.result.beginningValue)}</dd></div>
                  <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Ending value</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(calculation.result.endingValue)}</dd></div>
                </dl>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">This comparison shows only the endpoints. CAGR smooths the change and does not show the actual path between them.</p>
              </CardContent>
            </Card>
            <CalculationSummary title="ThinkCalculator CAGR Calculation" calculationDate={calculation.date} disclaimer="CAGR is an annualised endpoint measure, not a forecast. It excludes intermediate cash flows and hides volatility." items={[
              { label: "Beginning value", value: formatIndianCurrency(calculation.input.beginningValue) },
              { label: "Ending value", value: formatIndianCurrency(calculation.input.endingValue) },
              { label: "Investment period", value: `${formatIndianNumber(calculation.input.investmentPeriodYears)} years` },
              { label: "CAGR", value: formatCAGRPercentageForDisplay(calculation.result.cagrPercentage) },
              { label: gainLossLabel, value: formatIndianCurrency(normaliseCAGRDisplayZero(calculation.result.absoluteGainLoss)) },
              { label: "Total return", value: formatPercentage(normaliseCAGRDisplayZero(calculation.result.totalReturnPercentage)) },
              { label: "Growth multiple", value: `${formatIndianNumber(normaliseCAGRDisplayZero(calculation.result.growthMultiple))}×` },
            ]} />
          </>
        ) : null}
      </div>
    </>
  )
}
