"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { X } from "lucide-react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateIncomeTax, compareRegimes } from "@/lib/tax/engine"
import type { CompareRegimesInput, CompareRegimesResult, NewRegimeDeductionInput, OldRegimeDeductionInput, TaxCalcInput, TaxRegime } from "@/lib/tax/types"
import { cn } from "@/lib/utils"
import { INCOME_TAX_DEFAULT_FORM_VALUES, INCOME_TAX_LIMITS, isAgeBand, parseAndValidateIncomeTaxForm } from "./income-tax-schema"
import { INCOME_TAX_FINANCIAL_YEAR, INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"
import type { IncomeTaxFormErrors, IncomeTaxFormValues } from "./income-tax-types"
import { applyHraExemptionPassThrough, buildIncomeTaxCalculatorUrl, parseIncomeTaxUrlState } from "./income-tax-url-state"
import { IncomeTaxBreakdownCard, IncomeTaxRebateSurchargeCard, IncomeTaxSlabBreakdownSection } from "./income-tax-results"

/** Never notifies — paired with useSyncExternalStore below purely to get a snapshot value that
 * differs between the server render and the post-hydration client render, without calling setState
 * inside an effect (flagged by this repo's react-hooks/set-state-in-effect lint rule). */
function subscribeNever(): () => void {
  return () => {}
}

function HraPassThroughNote({ amount, onDismiss }: { readonly amount: number; readonly onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="hra-pass-through-note"
      className="mb-5 flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-4 text-sm leading-6"
    >
      <p>HRA exemption of {formatIndianCurrency(amount)} applied — this only affects the Old Regime calculation.</p>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={onDismiss}>
        <X aria-hidden="true" />
      </Button>
    </div>
  )
}

const ageBandOptions = [
  { label: "Below 60", value: "below60" },
  { label: "60 to 80 (senior citizen)", value: "60to80" },
  { label: "80 and above (super senior citizen)", value: "80plus" },
]

function RegimeToggle({ value, onChange }: { readonly value: TaxRegime; readonly onChange: (regime: TaxRegime) => void }) {
  const options: readonly { readonly label: string; readonly value: TaxRegime }[] = [
    { label: "New Regime", value: "new" },
    { label: "Old Regime", value: "old" },
  ]
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium">Tax regime</legend>
      <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/30 p-1" role="radiogroup" aria-label="Tax regime">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring",
              value === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <span aria-hidden="true">{option.label}</span>
            <input
              type="radio"
              name="tax-regime"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              aria-label={option.label}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Clamps an old-regime deduction bucket into range so live recalculation never throws:
 * calculateIncomeTax/compareRegimes call validateTaxCalcInput, which rejects section80C/80D/24(b)
 * above their statutory caps (and hraExemption/otherSection80Deductions above gross income) — a
 * range a typed value or slider move can easily cross transiently while the user is still editing.
 * Full validation is unchanged on submit/share. */
function clampOldRegimeDeductions(grossIncome: number, ageBand: IncomeTaxFormValues["ageBand"], raw: IncomeTaxFormValues["oldRegimeDeductions"]): OldRegimeDeductionInput {
  const caps = INCOME_TAX_RULE_SET.oldRegime.deductionCaps
  const section80DCap = ageBand === "below60" ? caps.section80D.below60 : caps.section80D.age60OrAbove
  const clampAmount = (value: string, max: number) => clampFinite(Number(value), 0, 0, Math.max(0, max))
  return {
    section80C: clampAmount(raw.section80C, caps.section80C),
    section80D: clampAmount(raw.section80D, section80DCap),
    hraExemption: clampAmount(raw.hraExemption, grossIncome),
    homeLoanInterestSection24b: clampAmount(raw.homeLoanInterestSection24b, caps.homeLoanInterestSection24b),
    otherSection80Deductions: clampAmount(raw.otherSection80Deductions, grossIncome),
  }
}

/** Same live-preview-only clamp reasoning as clampOldRegimeDeductions: employerNpsSection80CCD2
 * cannot exceed gross income under validateTaxCalcInput. */
function clampNewRegimeDeductions(grossIncome: number, raw: IncomeTaxFormValues["newRegimeDeductions"]): NewRegimeDeductionInput {
  return { employerNpsSection80CCD2: clampFinite(Number(raw.employerNpsSection80CCD2), 0, 0, Math.max(0, grossIncome)) }
}

function liveGrossIncome(values: IncomeTaxFormValues): number {
  return clampFinite(Number(values.grossIncome), Number(INCOME_TAX_DEFAULT_FORM_VALUES.grossIncome), INCOME_TAX_LIMITS.grossIncome.min, INCOME_TAX_LIMITS.grossIncome.max)
}

function liveAgeBand(values: IncomeTaxFormValues): IncomeTaxFormValues["ageBand"] {
  return isAgeBand(values.ageBand) ? values.ageBand : "below60"
}

/** Best-effort live view of the currently selected regime's inputs, so the breakdown card and slab
 * table can update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveTaxInput(values: IncomeTaxFormValues): TaxCalcInput {
  const grossIncome = liveGrossIncome(values)
  const ageBand = liveAgeBand(values)
  if (values.regime === "old") {
    return { regime: "old", grossIncome, ageBand, deductions: clampOldRegimeDeductions(grossIncome, ageBand, values.oldRegimeDeductions) }
  }
  return { regime: "new", grossIncome, ageBand, deductions: clampNewRegimeDeductions(grossIncome, values.newRegimeDeductions) }
}

/** Live view of both regimes at once, for the side-by-side comparison panel — independent of which
 * regime is currently selected, mirroring the pre-migration RegimeComparisonCallout's intent. */
function toLiveComparisonInput(values: IncomeTaxFormValues): CompareRegimesInput {
  const grossIncome = liveGrossIncome(values)
  const ageBand = liveAgeBand(values)
  return {
    grossIncome,
    ageBand,
    oldRegimeDeductions: clampOldRegimeDeductions(grossIncome, ageBand, values.oldRegimeDeductions),
    newRegimeDeductions: clampNewRegimeDeductions(grossIncome, values.newRegimeDeductions),
  }
}

function RegimeComparisonPanel({ comparison, selectedRegime, resultText, shareUrl }: { readonly comparison: CompareRegimesResult; readonly selectedRegime: TaxRegime; readonly resultText: string; readonly shareUrl: string }) {
  const beneficialLabel = comparison.beneficialRegime === "new" ? "New Regime" : "Old Regime"
  const otherLabel = comparison.beneficialRegime === "new" ? "Old Regime" : "New Regime"
  return (
    <Card className="bg-gradient-to-b from-cat-tax-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
      <CardContent>
        <div className="border-b border-line pb-5 text-center">
          <p className="mb-1.5 text-[13px] text-muted-foreground">{comparison.savings === 0 ? "Both regimes cost the same" : `${beneficialLabel} saves you`}</p>
          <p className="font-mono text-[42px] leading-none font-bold text-cat-tax">{formatIndianCurrency(comparison.savings)}</p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">{comparison.savings === 0 ? `${formatIndianCurrency(comparison.oldRegime.totalTaxLiability)} under either regime` : `versus the ${otherLabel}, at these figures`}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div data-testid="old-regime-column" className={cn("rounded-lg border p-3.5", selectedRegime === "old" ? "border-cat-tax" : "border-line", "bg-card")}>
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              Old Regime
              {comparison.beneficialRegime === "old" ? <span className="rounded-full bg-cat-tax-soft px-1.5 py-0.5 text-[10px] font-semibold text-cat-tax">Lower tax</span> : null}
            </p>
            <p className="font-mono text-lg font-semibold">{formatIndianCurrency(comparison.oldRegime.totalTaxLiability)}</p>
          </div>
          <div data-testid="new-regime-column" className={cn("rounded-lg border p-3.5", selectedRegime === "new" ? "border-cat-tax" : "border-line", "bg-card")}>
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              New Regime
              {comparison.beneficialRegime === "new" ? <span className="rounded-full bg-cat-tax-soft px-1.5 py-0.5 text-[10px] font-semibold text-cat-tax">Lower tax</span> : null}
            </p>
            <p className="font-mono text-lg font-semibold">{formatIndianCurrency(comparison.newRegime.totalTaxLiability)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">The highlighted border marks your currently selected regime — the full breakdown below is for that regime.</p>

        <div className="mt-5">
          <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
        </div>
      </CardContent>
    </Card>
  )
}

export function IncomeTaxCalculator() {
  const [values, setValues] = useState<IncomeTaxFormValues>(INCOME_TAX_DEFAULT_FORM_VALUES)
  const [errors, setErrors] = useState<IncomeTaxFormErrors>({})
  const [hraPassThroughAmount, setHraPassThroughAmount] = useState<number | null>(null)
  // Hydration-completion signal — see the matching comment in hra-calculator.tsx, which fills
  // fields the same way and is where this race was originally reproduced under WebKit.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    const { values: parsedValues, hraPassThroughAmount: passThroughAmount } = applyHraExemptionPassThrough(
      parseIncomeTaxUrlState(search),
      search,
    )
    if (passThroughAmount !== null) setHraPassThroughAmount(passThroughAmount)
    setValues(parsedValues)
  })

  function commit(nextValues: IncomeTaxFormValues) {
    setValues(nextValues)
    const validation = parseAndValidateIncomeTaxForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildIncomeTaxCalculatorUrl(validation.data))
  }

  function switchRegime(regime: TaxRegime) {
    markInteracted()
    commit({ ...values, regime })
  }

  function updateShared(field: "grossIncome" | "ageBand", value: string) {
    markInteracted()
    commit({ ...values, [field]: value } as IncomeTaxFormValues)
  }

  function updateOldDeduction(field: keyof IncomeTaxFormValues["oldRegimeDeductions"], value: string) {
    markInteracted()
    commit({ ...values, oldRegimeDeductions: { ...values.oldRegimeDeductions, [field]: value } })
  }

  function updateNewDeduction(field: keyof IncomeTaxFormValues["newRegimeDeductions"], value: string) {
    markInteracted()
    commit({ ...values, newRegimeDeductions: { ...values.newRegimeDeductions, [field]: value } })
  }

  function handleReset() {
    setValues(INCOME_TAX_DEFAULT_FORM_VALUES)
    setErrors({})
    window.history.replaceState(null, "", "/finance/income-tax-calculator")
  }

  const isOld = values.regime === "old"
  const liveTaxInput = useMemo(() => toLiveTaxInput(values), [values])
  const result = useMemo(() => calculateIncomeTax(liveTaxInput, INCOME_TAX_FINANCIAL_YEAR), [liveTaxInput])
  const comparisonInput = useMemo(() => toLiveComparisonInput(values), [values])
  const comparison = useMemo(() => compareRegimes(comparisonInput, INCOME_TAX_FINANCIAL_YEAR), [comparisonInput])
  const deductionErrors = errors.deductions ?? {}

  const shareUrl = buildIncomeTaxCalculatorUrl(liveTaxInput, siteConfig.url)
  const section80DCap = liveTaxInput.ageBand === "below60" ? INCOME_TAX_RULE_SET.oldRegime.deductionCaps.section80D.below60 : INCOME_TAX_RULE_SET.oldRegime.deductionCaps.section80D.age60OrAbove
  const resultText = [
    "ThinkCalculator Income Tax Calculation",
    "",
    `Regime: ${liveTaxInput.regime === "old" ? "Old Regime" : "New Regime"}`,
    `Gross income: ${formatIndianCurrency(liveTaxInput.grossIncome)}`,
    `Taxable income: ${formatIndianCurrency(result.taxableIncome)}`,
    `Tax before rebate: ${formatIndianCurrency(result.taxBeforeRebate)}`,
    `Section 87A rebate: ${formatIndianCurrency(result.rebate87A.rebateAmount)}`,
    `Surcharge: ${formatIndianCurrency(result.surcharge.surcharge)}`,
    `Cess: ${formatIndianCurrency(result.cess)}`,
    `Total tax liability: ${formatIndianCurrency(result.totalTaxLiability)}`,
    "",
    `Old Regime total tax: ${formatIndianCurrency(comparison.oldRegime.totalTaxLiability)}`,
    `New Regime total tax: ${formatIndianCurrency(comparison.newRegime.totalTaxLiability)}`,
    "",
    "Calculator:",
    `${siteConfig.url}/finance/income-tax-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form data-hydrated={hydrated}>
          <Card>
            <CardHeader><CardTitle className="text-base">Income tax details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <RegimeToggle value={values.regime} onChange={switchRegime} />
                  {errors.regime ? (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      {errors.regime}
                    </p>
                  ) : null}
                </div>

                {hraPassThroughAmount !== null ? (
                  <HraPassThroughNote amount={hraPassThroughAmount} onDismiss={() => setHraPassThroughAmount(null)} />
                ) : null}

                <PairedNumberSliderInput
                  id="gross-income"
                  label="Gross income"
                  description="Enter your total gross income for the financial year."
                  prefix="₹"
                  min={INCOME_TAX_LIMITS.grossIncome.min}
                  max={INCOME_TAX_LIMITS.grossIncome.max}
                  step={10_000}
                  sliderMin={0}
                  sliderMax={5_000_000}
                  value={values.grossIncome}
                  sliderValue={liveTaxInput.grossIncome}
                  onValueChange={(value) => updateShared("grossIncome", value)}
                  error={errors.grossIncome}
                  required
                  accentClassName="accent-cat-tax"
                />
                <CalculatorSelectInput
                  id="age-band"
                  label="Age band"
                  description="Age determines the nil-tax threshold under the old regime."
                  value={values.ageBand}
                  onValueChange={(value) => updateShared("ageBand", value)}
                  options={ageBandOptions}
                  error={errors.ageBand}
                  required
                />

                {isOld ? (
                  <>
                    <PairedNumberSliderInput id="section-80c" label="Section 80C" description="PF, ELSS, life insurance, and similar investments." prefix="₹" min={0} max={INCOME_TAX_RULE_SET.oldRegime.deductionCaps.section80C} step={1_000} value={values.oldRegimeDeductions.section80C} sliderValue={liveTaxInput.regime === "old" ? liveTaxInput.deductions.section80C : 0} onValueChange={(value) => updateOldDeduction("section80C", value)} error={deductionErrors.section80C} accentClassName="accent-cat-tax" />
                    <PairedNumberSliderInput id="section-80d" label="Section 80D" description="Health insurance premium paid for self and family." prefix="₹" min={0} max={section80DCap} step={1_000} value={values.oldRegimeDeductions.section80D} sliderValue={liveTaxInput.regime === "old" ? liveTaxInput.deductions.section80D : 0} onValueChange={(value) => updateOldDeduction("section80D", value)} error={deductionErrors.section80D} accentClassName="accent-cat-tax" />
                    <PairedNumberSliderInput id="hra-exemption" label="HRA exemption" description="Enter your already-calculated HRA exemption amount, not your full HRA received. Use the HRA Exemption Calculator if you need to work this out first." prefix="₹" min={0} max={Math.max(1, liveTaxInput.grossIncome)} step={1_000} value={values.oldRegimeDeductions.hraExemption} sliderValue={liveTaxInput.regime === "old" ? liveTaxInput.deductions.hraExemption : 0} onValueChange={(value) => updateOldDeduction("hraExemption", value)} error={deductionErrors.hraExemption} accentClassName="accent-cat-tax" />
                    <PairedNumberSliderInput id="home-loan-interest-24b" label="Home loan interest (24b)" description="Self-occupied property home loan interest." prefix="₹" min={0} max={INCOME_TAX_RULE_SET.oldRegime.deductionCaps.homeLoanInterestSection24b} step={1_000} value={values.oldRegimeDeductions.homeLoanInterestSection24b} sliderValue={liveTaxInput.regime === "old" ? liveTaxInput.deductions.homeLoanInterestSection24b : 0} onValueChange={(value) => updateOldDeduction("homeLoanInterestSection24b", value)} error={deductionErrors.homeLoanInterestSection24b} accentClassName="accent-cat-tax" />
                    <PairedNumberSliderInput id="other-80-deductions" label="Other Section 80 deductions" description="80E, 80G, 80TTA, and similar provisions." prefix="₹" min={0} max={Math.max(1, liveTaxInput.grossIncome)} step={1_000} value={values.oldRegimeDeductions.otherSection80Deductions} sliderValue={liveTaxInput.regime === "old" ? liveTaxInput.deductions.otherSection80Deductions : 0} onValueChange={(value) => updateOldDeduction("otherSection80Deductions", value)} error={deductionErrors.otherSection80Deductions} accentClassName="accent-cat-tax" />
                  </>
                ) : (
                  <PairedNumberSliderInput id="employer-nps-80ccd2" label="Employer NPS contribution (80CCD(2))" description="Enter the amount already capped at 14% of basic salary plus DA." prefix="₹" min={0} max={Math.max(1, liveTaxInput.grossIncome)} step={1_000} value={values.newRegimeDeductions.employerNpsSection80CCD2} sliderValue={liveTaxInput.regime === "new" ? liveTaxInput.deductions.employerNpsSection80CCD2 : 0} onValueChange={(value) => updateNewDeduction("employerNpsSection80CCD2", value)} error={deductionErrors.employerNpsSection80CCD2} accentClassName="accent-cat-tax" />
                )}

                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  <strong>Narrow scope:</strong> this applies regular slab-rate income only. Capital gains, other special-rate income, TDS, and advance tax are not modelled. Verify against official sources or consult a qualified professional before filing.
                </div>
                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <RegimeComparisonPanel comparison={comparison} selectedRegime={values.regime} resultText={resultText} shareUrl={shareUrl} />
      </div>

      <div className="mt-6 space-y-6" data-calculation-experience>
        <IncomeTaxBreakdownCard result={result} />
        <IncomeTaxRebateSurchargeCard result={result} />
      </div>

      <IncomeTaxSlabBreakdownSection result={result} />
    </div>
  )
}
