"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateEpsPension } from "./calculate-eps-pension"
import { createEpsPensionResultText } from "./eps-pension-content"
import { toLiveInput } from "./eps-pension-live-input"
import {
  EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS,
  EPS_PENSION_DIVISOR,
  EPS_PENSION_EARLY_PENSION_MIN_AGE,
  EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS,
  EPS_PENSION_STANDARD_RETIREMENT_AGE,
  EPS_PENSION_WAGE_CEILING,
} from "./eps-pension-regulatory-config"
import { EPS_PENSION_LIMITS, parseAndValidateEpsPensionForm, type EpsPensionFormValues } from "./eps-pension-schema"
import type { EpsPensionInput, EpsPensionValidationErrors } from "./eps-pension-types"
import { buildEpsPensionCalculatorUrl, EPS_PENSION_DEFAULT_INPUT, parseEpsPensionUrlState } from "./eps-pension-url-state"

const AGE_OPTIONS = [
  { label: `Standard age (${EPS_PENSION_STANDARD_RETIREMENT_AGE})`, value: "standard" },
  { label: `Early pension (${EPS_PENSION_EARLY_PENSION_MIN_AGE}–57)`, value: "early" },
]

function toFormValues(input: EpsPensionInput): EpsPensionFormValues {
  return {
    averageMonthlySalary: String(input.averageMonthlySalary),
    yearsOfPensionableService: String(input.yearsOfPensionableService),
    ageOption: input.ageOption,
    earlyPensionAge: String(input.earlyPensionAge),
  }
}

export function EpsPensionCalculator() {
  const [values, setValues] = useState<EpsPensionFormValues>(() => toFormValues(EPS_PENSION_DEFAULT_INPUT))
  const [errors, setErrors] = useState<EpsPensionValidationErrors>({})

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseEpsPensionUrlState(search)))
  })

  function update(field: keyof EpsPensionFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateEpsPensionForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildEpsPensionCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(EPS_PENSION_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/eps-pension-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateEpsPension(liveInput), [liveInput])
  const isEarly = liveInput.ageOption === "early"

  const shareUrl = buildEpsPensionCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createEpsPensionResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Pension details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <PairedNumberSliderInput
                  id="average-monthly-salary"
                  label="Average monthly basic + DA (last 60 months)"
                  description={`Not gross salary or CTC. The formula caps this at ₹${EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")} for a standard member.`}
                  prefix="₹"
                  min={EPS_PENSION_LIMITS.averageMonthlySalary.min}
                  max={EPS_PENSION_LIMITS.averageMonthlySalary.max}
                  step={100}
                  sliderMin={0}
                  sliderMax={100_000}
                  value={values.averageMonthlySalary}
                  sliderValue={liveInput.averageMonthlySalary}
                  onValueChange={(value) => update("averageMonthlySalary", value)}
                  error={errors.averageMonthlySalary}
                  required
                  accentClassName="accent-cat-savings"
                />
                <PairedNumberSliderInput
                  id="years-of-pensionable-service"
                  label="Years of pensionable service"
                  description={`At least ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS} years are needed for a monthly pension. ${EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}+ years adds a bonus.`}
                  suffix="years"
                  min={EPS_PENSION_LIMITS.yearsOfPensionableService.min}
                  max={EPS_PENSION_LIMITS.yearsOfPensionableService.max}
                  step={1}
                  value={values.yearsOfPensionableService}
                  sliderValue={liveInput.yearsOfPensionableService}
                  onValueChange={(value) => update("yearsOfPensionableService", value)}
                  error={errors.yearsOfPensionableService}
                  required
                  accentClassName="accent-cat-savings"
                />
                <CalculatorSelectInput
                  id="age-option"
                  label="Pension option"
                  description="Early pension is shown as a clearly separate, reduced figure from the standard-age pension."
                  value={values.ageOption}
                  onValueChange={(value) => update("ageOption", value)}
                  options={AGE_OPTIONS}
                  error={errors.ageOption}
                  required
                />
                {isEarly ? (
                  <PairedNumberSliderInput
                    id="early-pension-age"
                    label="Early pension start age"
                    description={`Reduces the standard-age pension by 4% for every year short of ${EPS_PENSION_STANDARD_RETIREMENT_AGE}.`}
                    suffix="years"
                    min={EPS_PENSION_LIMITS.earlyPensionAge.min}
                    max={EPS_PENSION_LIMITS.earlyPensionAge.max}
                    step={1}
                    value={values.earlyPensionAge}
                    sliderValue={liveInput.earlyPensionAge}
                    onValueChange={(value) => update("earlyPensionAge", value)}
                    error={errors.earlyPensionAge}
                    required
                    accentClassName="accent-cat-savings"
                  />
                ) : null}
                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  <strong>Narrow scope:</strong> this applies the standard EPS 2026 formula only. It does not model the post-2022 Supreme Court higher-pension option, family pension, or the sub-10-year withdrawal benefit.
                </div>
                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-savings-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            {result.isEligible ? (
              <div className="border-b border-line pb-5 text-center">
                <p className="mb-1.5 text-[13px] text-muted-foreground">{isEarly ? `Monthly pension from age ${result.earlyPensionAge}` : "Monthly pension"}</p>
                <p className="font-mono text-[42px] leading-none font-bold text-cat-savings">{formatIndianCurrency(result.monthlyPension)}</p>
                <p className="mt-2 text-[12.5px] text-muted-foreground">
                  {isEarly
                    ? `Standard-age pension ${formatIndianCurrency(result.standardMonthlyPension)}, reduced ${formatIndianNumber(result.earlyPensionReductionPercent)}%`
                    : result.isFloorBinding
                      ? `Minimum-pension floor applied — formula alone gave ${formatIndianCurrency(result.formulaPension)}`
                      : "Based on the EPS 2026 formula"}
                </p>
              </div>
            ) : (
              <div className="border-b border-line pb-5 text-center">
                <p className="mb-1.5 text-[13px] text-muted-foreground">Monthly pension</p>
                <p className="font-mono text-[42px] leading-none font-bold text-destructive">Not eligible</p>
                <p className="mt-2 text-[12.5px] text-muted-foreground">{`${formatIndianNumber(liveInput.yearsOfPensionableService)} years is short of the ${EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS}-year minimum for a monthly EPS pension.`}</p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Pensionable salary used</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.pensionableSalaryUsed)}</p>
                {result.isWageCeilingBinding ? <p className="mt-1 text-xs text-muted-foreground">Capped from {formatIndianCurrency(liveInput.averageMonthlySalary)}</p> : null}
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Pensionable service used</p>
                <p className="font-mono text-lg font-semibold">{formatIndianNumber(result.pensionableServiceUsed)} years</p>
                {result.bonusYearsApplied ? <p className="mt-1 text-xs text-muted-foreground">Includes {EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus</p> : null}
              </div>
              <div className="col-span-2 rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Standard-age pension (age {EPS_PENSION_STANDARD_RETIREMENT_AGE})</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.standardMonthlyPension)}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6" data-calculation-experience>
        <CollapsibleSection title="Detailed formula and eligibility breakdown" description="A step-by-step view of every intermediate figure used in the calculation above.">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Eligible for a monthly pension ({EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS}+ years)</dt><dd className="font-mono text-base font-medium">{result.isEligible ? "Yes" : "No"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Wage ceiling binding (₹{EPS_PENSION_WAGE_CEILING.toLocaleString("en-IN")})</dt><dd className="font-mono text-base font-medium">{result.isWageCeilingBinding ? "Yes" : "No"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS}-year bonus applied</dt><dd className="font-mono text-base font-medium">{result.bonusYearsApplied ? "Yes (+2 years)" : "No"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Formula pension (pensionable salary × service ÷ {EPS_PENSION_DIVISOR})</dt><dd className="font-mono text-base font-medium">{formatIndianCurrency(result.formulaPension)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Minimum-pension floor</dt><dd className="font-mono text-base font-medium">{formatIndianCurrency(result.minimumPensionFloor)}{result.isFloorBinding ? " (applied)" : ""}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Standard-age pension</dt><dd className="font-mono text-base font-medium">{formatIndianCurrency(result.standardMonthlyPension)}</dd></div>
            {isEarly ? (
              <>
                <div><dt className="text-xs text-muted-foreground">Early pension reduction</dt><dd className="font-mono text-base font-medium">{formatIndianNumber(result.earlyPensionReductionPercent)}%</dd></div>
                <div><dt className="text-xs text-muted-foreground">Early pension (from age {result.earlyPensionAge})</dt><dd className="font-mono text-base font-medium">{formatIndianCurrency(result.earlyMonthlyPension)}</dd></div>
              </>
            ) : null}
          </dl>
        </CollapsibleSection>
      </div>
    </div>
  )
}
