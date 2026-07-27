"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { calculateCAGR } from "@/features/calculators/cagr/calculate-cagr"
import { CAGR_LIMITS, parseAndValidateCAGRForm, type CAGRFormValues } from "@/features/calculators/cagr/cagr-schema"
import { buildCAGRCalculatorUrl, CAGR_DEFAULT_INPUT, parseCAGRUrlState } from "@/features/calculators/cagr/cagr-url-state"
import type { CAGRInput, CAGRResult, CAGRValidationErrors } from "@/features/calculators/cagr/cagr-types"
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorResultItem } from "@/types/calculator"

const BEGINNING_QUICK_AMOUNTS = [
  { label: "50K", value: "50000" },
  { label: "1L", value: "100000" },
  { label: "5L", value: "500000" },
  { label: "10L", value: "1000000" },
]

function toFormValues(input: CAGRInput): CAGRFormValues {
  return { beginningValue: String(input.beginningValue), endingValue: String(input.endingValue), investmentPeriodYears: String(input.investmentPeriodYears) }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Keeps the CAGR exponent (1/years) from producing a non-finite result on extreme ratios during
 * live recalculation — pushes the years figure up (which shrinks the exponent) until it's safe.
 * The schema's own validation still applies in full on submit/share; this only protects live preview. */
function clampCAGRForSafety(input: CAGRInput): CAGRInput {
  if (input.endingValue <= 0 || input.beginningValue <= 0) return input
  const ratio = input.endingValue / input.beginningValue
  let years = input.investmentPeriodYears
  while (!Number.isFinite(ratio ** (1 / years)) && years < CAGR_LIMITS.investmentPeriodYears.max) {
    years = Math.min(CAGR_LIMITS.investmentPeriodYears.max, years * 2)
  }
  const rounded = Math.round(years * 100) / 100
  return rounded === input.investmentPeriodYears ? input : { ...input, investmentPeriodYears: rounded }
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. Rounded to
 * two decimal places because the schema rejects finer precision on investmentPeriodYears. */
function toLiveInput(values: CAGRFormValues): CAGRInput {
  const rawYears = clampFinite(Number(values.investmentPeriodYears), CAGR_DEFAULT_INPUT.investmentPeriodYears, CAGR_LIMITS.investmentPeriodYears.min, CAGR_LIMITS.investmentPeriodYears.max)
  return clampCAGRForSafety({
    beginningValue: clampFinite(Number(values.beginningValue), CAGR_DEFAULT_INPUT.beginningValue, CAGR_LIMITS.beginningValue.min, CAGR_LIMITS.beginningValue.max),
    endingValue: clampFinite(Number(values.endingValue), CAGR_DEFAULT_INPUT.endingValue, CAGR_LIMITS.endingValue.min, CAGR_LIMITS.endingValue.max),
    investmentPeriodYears: Math.round(rawYears * 100) / 100,
  })
}

export function normaliseCAGRDisplayZero(value: number): number {
  return Object.is(value, -0) ? 0 : value
}

const scientificPercentageFormatter = new Intl.NumberFormat("en-IN", { notation: "scientific", maximumFractionDigits: 2 })

export function formatCAGRPercentageForDisplay(value: number): string {
  const normalised = normaliseCAGRDisplayZero(value)
  return Math.abs(normalised) >= 1_000_000_000_000 ? `${scientificPercentageFormatter.format(normalised)}%` : formatPercentage(normalised)
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

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseCAGRUrlState(search)))
  })

  function updateValue(field: keyof CAGRFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateCAGRForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildCAGRCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(CAGR_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/cagr-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateCAGR(liveInput), [liveInput])
  useTrackCalculationCompleted("cagr", "investments", result)
  const gainLossLabel = getCAGRGainLossLabel(result)

  const shareUrl = buildCAGRCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createCAGRResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">CAGR details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="beginning-value"
                    label="Beginning value"
                    description="Enter the value at the start of the period."
                    prefix="₹"
                    min={CAGR_LIMITS.beginningValue.min}
                    max={CAGR_LIMITS.beginningValue.max}
                    step={0.01}
                    sliderMin={1_000}
                    sliderMax={10_000_000}
                    value={values.beginningValue}
                    sliderValue={liveInput.beginningValue}
                    onValueChange={(value) => updateValue("beginningValue", value)}
                    error={errors.beginningValue}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {BEGINNING_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("beginningValue", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="ending-value"
                  label="Ending value"
                  description="Enter the value at the end of the period."
                  prefix="₹"
                  min={CAGR_LIMITS.endingValue.min}
                  max={CAGR_LIMITS.endingValue.max}
                  step={0.01}
                  sliderMin={0}
                  sliderMax={20_000_000}
                  value={values.endingValue}
                  sliderValue={liveInput.endingValue}
                  onValueChange={(value) => updateValue("endingValue", value)}
                  error={errors.endingValue}
                  required
                  accentClassName="accent-cat-invest"
                />

                <PairedNumberSliderInput
                  id="investment-period"
                  label="Investment period"
                  description="Enter years from 0.01 to 100, with up to two decimal places."
                  suffix="years"
                  min={CAGR_LIMITS.investmentPeriodYears.min}
                  max={CAGR_LIMITS.investmentPeriodYears.max}
                  step={0.01}
                  sliderMin={1}
                  sliderMax={30}
                  value={values.investmentPeriodYears}
                  sliderValue={liveInput.investmentPeriodYears}
                  onValueChange={(value) => updateValue("investmentPeriodYears", value)}
                  error={errors.investmentPeriodYears}
                  required
                  accentClassName="accent-cat-invest"
                />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Compound annual growth rate</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatCAGRPercentageForDisplay(result.cagrPercentage)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(liveInput.beginningValue)} to {formatIndianCurrency(liveInput.endingValue)} over {formatIndianNumber(liveInput.investmentPeriodYears)} years</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">{gainLossLabel}</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(normaliseCAGRDisplayZero(result.absoluteGainLoss))}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total return</p>
                <p className="font-mono text-lg font-semibold">{formatPercentage(normaliseCAGRDisplayZero(result.totalReturnPercentage))}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5 col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">Growth multiple</p>
                <p className="font-mono text-lg font-semibold">{formatIndianNumber(normaliseCAGRDisplayZero(result.growthMultiple))}×</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="cagr" category="investments" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Beginning versus ending value</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Beginning value</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.beginningValue)}</dd></div>
              <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Ending value</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.endingValue)}</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">This comparison shows only the endpoints. CAGR smooths the change and does not show the actual path between them.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
