"use client"

import { useMemo, useState, type FormEvent } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateGratuity } from "./calculate-gratuity"
import { createGratuityOrdinaryServiceText, createGratuityPrintDisclaimer, createGratuityResultText, hasOrdinaryGratuityService } from "./gratuity-content"
import { GRATUITY_ORDINARY_SERVICE_YEARS, GRATUITY_REGULATORY_REVIEW_DATE } from "./gratuity-regulatory-config"
import { GRATUITY_LIMITS, parseAndValidateGratuityForm, type GratuityFormValues } from "./gratuity-schema"
import type { GratuityInput, GratuityValidationErrors } from "./gratuity-types"
import { buildGratuityCalculatorUrl, GRATUITY_DEFAULT_INPUT, parseGratuityUrlState } from "./gratuity-url-state"

const WAGES_QUICK_AMOUNTS = [
  { label: "25K", value: "25000" },
  { label: "50K", value: "50000" },
  { label: "1L", value: "100000" },
  { label: "2L", value: "200000" },
]

function toFormValues(input: GratuityInput): GratuityFormValues {
  return {
    eligibleMonthlyWages: String(input.eligibleMonthlyWages),
    completedYears: String(input.completedYears),
    additionalMonths: String(input.additionalMonths),
  }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form.
 * completedYears/additionalMonths are rounded to whole numbers because calculateGratuity's own
 * validation (validateGratuityInput) rejects non-integers for both. */
function toLiveInput(values: GratuityFormValues): GratuityInput {
  return {
    eligibleMonthlyWages: clampFinite(Number(values.eligibleMonthlyWages), GRATUITY_DEFAULT_INPUT.eligibleMonthlyWages, GRATUITY_LIMITS.eligibleMonthlyWages.min, GRATUITY_LIMITS.eligibleMonthlyWages.max),
    completedYears: Math.round(clampFinite(Number(values.completedYears), GRATUITY_DEFAULT_INPUT.completedYears, GRATUITY_LIMITS.completedYears.min, GRATUITY_LIMITS.completedYears.max)),
    additionalMonths: Math.round(clampFinite(Number(values.additionalMonths), GRATUITY_DEFAULT_INPUT.additionalMonths, GRATUITY_LIMITS.additionalMonths.min, GRATUITY_LIMITS.additionalMonths.max)),
  }
}

export function GratuityCalculator() {
  const [values, setValues] = useState<GratuityFormValues>(() => toFormValues(GRATUITY_DEFAULT_INPUT))
  const [errors, setErrors] = useState<GratuityValidationErrors>({})

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseGratuityUrlState(search)))
  })

  function update(field: keyof GratuityFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateGratuityForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildGratuityCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(GRATUITY_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/gratuity-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateGratuity(liveInput), [liveInput])
  const ordinaryServiceMet = hasOrdinaryGratuityService(liveInput)

  const shareUrl = buildGratuityCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
  const resultText = createGratuityResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Gratuity details</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
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
                  <input type="range" aria-label="Eligible monthly wages slider" min={5_000} max={500_000} step={1_000} value={liveInput.eligibleMonthlyWages} onChange={(event) => update("eligibleMonthlyWages", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                  <div className="mt-2 flex gap-1.5">
                    {WAGES_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => update("eligibleMonthlyWages", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-tax hover:text-cat-tax focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
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
                  <input type="range" aria-label="Completed years of service slider" min={GRATUITY_LIMITS.completedYears.min} max={GRATUITY_LIMITS.completedYears.max} step={1} value={liveInput.completedYears} onChange={(event) => update("completedYears", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                </div>
                <div>
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
                  <input type="range" aria-label="Additional completed months slider" min={GRATUITY_LIMITS.additionalMonths.min} max={GRATUITY_LIMITS.additionalMonths.max} step={1} value={liveInput.additionalMonths} onChange={(event) => update("additionalMonths", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  <strong>Narrow scope:</strong> this estimates the standard amount for a regular monthly rated employee. It does not decide coverage, continuous service, termination-event eligibility, fixed-term or other special cases, better contractual terms, or forfeiture.
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate gratuity</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-tax-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated gratuity after ceiling</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-tax">{formatIndianCurrency(result.estimatedGratuity)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(liveInput.eligibleMonthlyWages)} monthly wages over {formatIndianNumber(result.countedServiceYears)} counted years</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Gratuity before ceiling</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.gratuityBeforeCeiling)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Daily wage basis</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.dailyWageBasis)}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Ceiling status</p>
                <p className="font-mono text-lg font-semibold">{result.ceilingApplied ? `Applied — reduced by ${formatIndianCurrency(result.ceilingAdjustment)}` : "Not applied"}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
        <Card>
          <CardHeader><CardTitle className="text-lg">How service was counted</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>You entered {liveInput.completedYears} completed years and {liveInput.additionalMonths} additional completed months.</p>
            <p>The standard formula counts {formatIndianNumber(result.countedServiceYears)} years because {liveInput.additionalMonths > 6 ? "the additional months are in excess of six" : "the additional months are not in excess of six"}.</p>
            <p>{result.ceilingApplied ? `The formula amount exceeded the statutory ceiling, reducing the displayed estimate by ${formatIndianCurrency(result.ceilingAdjustment)}.` : `The formula amount is below the ${formatIndianCurrency(result.statutoryCeiling)} statutory ceiling, so no ceiling adjustment was applied.`}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator Gratuity Estimate"
          calculationDate={calculationDate}
          disclaimer={createGratuityPrintDisclaimer()}
          items={[
            { label: "Eligible monthly wages entered", value: formatIndianCurrency(liveInput.eligibleMonthlyWages) },
            { label: "Completed service entered", value: `${liveInput.completedYears} years ${liveInput.additionalMonths} months` },
            { label: "Counted service for standard formula", value: `${formatIndianNumber(result.countedServiceYears)} years` },
            { label: "Daily wage basis", value: formatIndianCurrency(result.dailyWageBasis) },
            { label: "Gratuity before statutory ceiling", value: formatIndianCurrency(result.gratuityBeforeCeiling) },
            { label: "Statutory ceiling used", value: formatIndianCurrency(result.statutoryCeiling) },
            { label: "Estimated gratuity after ceiling", value: formatIndianCurrency(result.estimatedGratuity) },
            { label: "Ceiling status", value: result.ceilingApplied ? "Applied" : "Not applied" },
            { label: "Ordinary service threshold", value: createGratuityOrdinaryServiceText(liveInput) },
            { label: "Regulatory review date", value: GRATUITY_REGULATORY_REVIEW_DATE },
          ]}
        />
      </div>
    </div>
  )
}
