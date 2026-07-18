"use client"

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight, X } from "lucide-react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { computeHraExemption } from "@/lib/hra/engine"
import { isHraCity } from "@/lib/hra/validation"
import type { HraCalcInput } from "@/lib/hra/types"
import { createHraPrintDisclaimer, createHraResultText, createMetroCityListNoticeText } from "./hra-content"
import { HRA_FINANCIAL_YEAR, HRA_REGULATORY_REVIEW_DATE } from "./hra-regulatory-config"
import { HRA_DEFAULT_FORM_VALUES, HRA_LIMITS, parseAndValidateHraForm } from "./hra-schema"
import type { HraFormErrors, HraFormValues } from "./hra-types"
import { buildHraCalculatorUrl, buildIncomeTaxPassThroughUrl, parseHraUrlState } from "./hra-url-state"
import { HraBindingConstraintCard, describeBindingConstraint } from "./hra-results"

const cityOptions = [
  { label: "Metro (Delhi, Mumbai, Kolkata, Chennai)", value: "metro" },
  { label: "Non-metro", value: "non-metro" },
]

/** Never notifies — paired with useSyncExternalStore below purely to get a snapshot value that
 * differs between the server render and the post-hydration client render, without calling setState
 * inside an effect (flagged by this repo's react-hooks/set-state-in-effect lint rule). */
function subscribeNever(): () => void {
  return () => {}
}

const SALARY_QUICK_AMOUNTS = [
  { label: "3L", value: "300000" },
  { label: "6L", value: "600000" },
  { label: "12L", value: "1200000" },
  { label: "24L", value: "2400000" },
]

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: HraFormValues): HraCalcInput {
  return {
    basicSalary: clampFinite(Number(values.basicSalary), Number(HRA_DEFAULT_FORM_VALUES.basicSalary), HRA_LIMITS.amount.min, HRA_LIMITS.amount.max),
    da: clampFinite(Number(values.da), Number(HRA_DEFAULT_FORM_VALUES.da), HRA_LIMITS.amount.min, HRA_LIMITS.amount.max),
    hraReceived: clampFinite(Number(values.hraReceived), Number(HRA_DEFAULT_FORM_VALUES.hraReceived), HRA_LIMITS.amount.min, HRA_LIMITS.amount.max),
    rentPaid: clampFinite(Number(values.rentPaid), Number(HRA_DEFAULT_FORM_VALUES.rentPaid), HRA_LIMITS.amount.min, HRA_LIMITS.amount.max),
    city: isHraCity(values.city) ? values.city : "metro",
  }
}

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
  const [metroNoticeDismissed, setMetroNoticeDismissed] = useState(false)
  // Hydration-completion signal: flips true only once React has mounted client-side and attached
  // its event listeners. Playwright's WebKit runs (tests/e2e/hra-calculator.spec.ts) intermittently
  // filled fields fast enough to beat hydration — the very first fill landed as a native DOM
  // mutation with no React listener yet attached to catch it, so it never reached component state,
  // while later fills (after hydration caught up) worked normally. The test now waits for this
  // attribute before its first fill instead of racing hydration; see that spec for the assertion.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(parseHraUrlState(search))
  })

  function update(field: keyof HraFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateHraForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    window.history.replaceState(null, "", buildHraCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(HRA_DEFAULT_FORM_VALUES)
    setErrors({})
    window.history.replaceState(null, "", "/finance/hra-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => computeHraExemption(liveInput, HRA_FINANCIAL_YEAR), [liveInput])

  const shareUrl = buildHraCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
  const resultText = createHraResultText(result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form data-hydrated={hydrated}>
          {!metroNoticeDismissed ? <MetroCityListNotice onDismiss={() => setMetroNoticeDismissed(true)} /> : null}
          <Card>
            <CardHeader><CardTitle className="text-base">HRA details</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
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
                  <input type="range" aria-label="Basic salary slider" min={100_000} max={5_000_000} step={10_000} value={liveInput.basicSalary} onChange={(event) => update("basicSalary", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                  <div className="mt-2 flex gap-1.5">
                    {SALARY_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => update("basicSalary", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-tax hover:text-cat-tax focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
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
                  <input type="range" aria-label="DA slider" min={0} max={1_000_000} step={5_000} value={liveInput.da} onChange={(event) => update("da", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                </div>
                <div>
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
                  <input type="range" aria-label="HRA received slider" min={0} max={2_500_000} step={10_000} value={liveInput.hraReceived} onChange={(event) => update("hraReceived", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                </div>
                <div>
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
                  <input type="range" aria-label="Rent paid slider" min={0} max={2_500_000} step={10_000} value={liveInput.rentPaid} onChange={(event) => update("rentPaid", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-tax" />
                </div>
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
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-tax-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Exempt HRA</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-tax">{formatIndianCurrency(result.exemptHra)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">of {formatIndianCurrency(liveInput.hraReceived)} HRA received, {liveInput.city === "metro" ? "metro" : "non-metro"} city</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Taxable HRA</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.taxableHra)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Actual HRA received</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.actualHraReceived)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Rent minus 10% of salary</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.rentMinusTenPercentSalary)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">{result.percentOfSalaryRate * 100}% of salary</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.percentOfSalary)}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <HraBindingConstraintCard result={result} />
        <Button
          className="w-full sm:w-auto"
          size="lg"
          nativeButton={false}
          render={<Link href={buildIncomeTaxPassThroughUrl(result.exemptHra)} />}
        >
          Use this in the Income Tax Calculator <ArrowRight aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator HRA Exemption Calculation"
          calculationDate={calculationDate}
          disclaimer={createHraPrintDisclaimer()}
          items={[
            { label: "Financial year", value: `${result.financialYear} (AY ${result.assessmentYear})` },
            { label: "City", value: liveInput.city === "metro" ? "Metro" : "Non-metro" },
            { label: "Salary (basic + DA)", value: formatIndianCurrency(result.salary) },
            { label: "HRA received", value: formatIndianCurrency(liveInput.hraReceived) },
            { label: "Rent paid", value: formatIndianCurrency(liveInput.rentPaid) },
            { label: "Actual HRA received", value: formatIndianCurrency(result.actualHraReceived) },
            { label: "Rent paid minus 10% of salary", value: formatIndianCurrency(result.rentMinusTenPercentSalary) },
            { label: `${result.percentOfSalaryRate * 100}% of salary`, value: formatIndianCurrency(result.percentOfSalary) },
            { label: "Binding constraint", value: describeBindingConstraint(result) },
            { label: "Exempt HRA", value: formatIndianCurrency(result.exemptHra) },
            { label: "Taxable HRA", value: formatIndianCurrency(result.taxableHra) },
            { label: "Regulatory review date", value: HRA_REGULATORY_REVIEW_DATE },
          ]}
        />
      </div>
    </div>
  )
}
