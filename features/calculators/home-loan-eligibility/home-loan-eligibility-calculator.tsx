"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { calculateFOIRBandComparison, calculateHomeLoanEligibility } from "@/features/calculators/home-loan-eligibility/calculate-home-loan-eligibility"
import {
  FOIR_BAND_OPTIONS,
  HOME_LOAN_ELIGIBILITY_LIMITS,
  parseAndValidateHomeLoanEligibilityForm,
  type HomeLoanEligibilityFormValues,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-schema"
import {
  buildHomeLoanEligibilityCalculatorUrl,
  HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT,
  parseHomeLoanEligibilityUrlState,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-url-state"
import type {
  FOIRBand,
  FOIRBandComparisonRow,
  HomeLoanEligibilityInput,
  HomeLoanEligibilityValidationErrors,
} from "@/features/calculators/home-loan-eligibility/home-loan-eligibility-types"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"

/** Never notifies — paired with useSyncExternalStore below purely to get a snapshot value that
 * differs between the server render and the post-hydration client render, without calling setState
 * inside an effect. Same fix as hra-calculator.tsx/income-tax-calculator.tsx: without it, a fast
 * automated `.fill()` right after navigation can land before React attaches its listeners, so the
 * typed value never reaches component state. */
function subscribeNever(): () => void {
  return () => {}
}

const FOIR_BAND_LABELS: Readonly<Record<FOIRBand, string>> = {
  conservative: "Conservative (40%)",
  standard: "Standard (50%)",
  aggressive: "Aggressive (60%)",
}

const comparisonColumns: readonly DataTableColumn<FOIRBandComparisonRow>[] = [
  { header: "FOIR band", cell: (row) => FOIR_BAND_LABELS[row.foirBand] },
  { header: "Max eligible EMI", cell: (row) => formatIndianCurrency(row.maxEligibleEMI) },
  { header: "Max eligible loan amount", cell: (row) => formatIndianCurrency(row.maxEligibleLoanAmount) },
  { header: "Total property affordability", cell: (row) => formatIndianCurrency(row.totalPropertyAffordability) },
]

function toFormValues(input: HomeLoanEligibilityInput): HomeLoanEligibilityFormValues {
  return {
    netMonthlyIncome: String(input.netMonthlyIncome),
    existingMonthlyEMI: String(input.existingMonthlyEMI),
    annualInterestRate: String(input.annualInterestRate),
    tenureYears: String(input.tenureYears),
    ownContribution: String(input.ownContribution),
    foirBand: input.foirBand,
  }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range, so the result panel
 * updates on every keystroke/slider move instead of waiting for a valid, submitted form —
 * matching the same defensive-clamp pattern the EMI calculator uses. */
function toLiveInput(values: HomeLoanEligibilityFormValues): HomeLoanEligibilityInput {
  const foirBand: FOIRBand = values.foirBand === "conservative" || values.foirBand === "aggressive" ? values.foirBand : "standard"
  return {
    netMonthlyIncome: clampFinite(Number(values.netMonthlyIncome), HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT.netMonthlyIncome, HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.min, HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.max),
    existingMonthlyEMI: clampFinite(Number(values.existingMonthlyEMI), HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT.existingMonthlyEMI, HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.min, HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.max),
    annualInterestRate: clampFinite(Number(values.annualInterestRate), HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT.annualInterestRate, HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.min, HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.max),
    tenureYears: Math.round(clampFinite(Number(values.tenureYears), HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT.tenureYears, HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.min, HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.max)),
    ownContribution: clampFinite(Number(values.ownContribution), HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT.ownContribution, HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.min, HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.max),
    foirBand,
  }
}

export function HomeLoanEligibilityCalculator() {
  const [values, setValues] = useState<HomeLoanEligibilityFormValues>(() => toFormValues(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))
  const [errors, setErrors] = useState<HomeLoanEligibilityValidationErrors>({})
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false)

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseHomeLoanEligibilityUrlState(search)))
  })

  function updateValue(field: keyof HomeLoanEligibilityFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateHomeLoanEligibilityForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildHomeLoanEligibilityCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(HOME_LOAN_ELIGIBILITY_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/home-loan-eligibility-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateHomeLoanEligibility(liveInput), [liveInput])
  useTrackCalculationCompleted("home-loan-eligibility", "loans", result)
  const bandComparison = useMemo(() => calculateFOIRBandComparison(liveInput), [liveInput])

  const shareUrl = buildHomeLoanEligibilityCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator Home Loan Eligibility",
    "",
    `Net monthly income: ${formatIndianCurrency(liveInput.netMonthlyIncome)}`,
    `Existing monthly EMI: ${formatIndianCurrency(liveInput.existingMonthlyEMI)}`,
    `FOIR band: ${FOIR_BAND_LABELS[liveInput.foirBand]}`,
    `Annual interest rate: ${liveInput.annualInterestRate.toFixed(2)}%`,
    `Loan tenure: ${liveInput.tenureYears} years`,
    `Own contribution: ${formatIndianCurrency(liveInput.ownContribution)}`,
    "",
    `Max eligible EMI: ${formatIndianCurrency(result.maxEligibleEMI)}`,
    `Max eligible loan amount: ${formatIndianCurrency(result.maxEligibleLoanAmount)}`,
    `Total property affordability: ${formatIndianCurrency(result.totalPropertyAffordability)}`,
    "", "Calculator:", `${siteConfig.url}/finance/home-loan-eligibility-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form data-hydrated={hydrated}>
          <Card>
            <CardHeader><CardTitle className="text-base">Income and loan details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <PairedNumberSliderInput
                  id="net-monthly-income"
                  label="Net monthly income"
                  description="Enter your take-home monthly income after deductions."
                  prefix="₹"
                  min={HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.min}
                  max={HOME_LOAN_ELIGIBILITY_LIMITS.netMonthlyIncome.max}
                  step={1_000}
                  sliderMax={500_000}
                  value={values.netMonthlyIncome}
                  sliderValue={liveInput.netMonthlyIncome}
                  onValueChange={(value) => updateValue("netMonthlyIncome", value)}
                  error={errors.netMonthlyIncome}
                  required
                  accentClassName="accent-money"
                  helperTextVariant="tooltip"
                />

                <PairedNumberSliderInput
                  id="existing-monthly-emi"
                  label="Existing monthly EMI obligations"
                  description="Total EMI you already pay on other loans, if any."
                  prefix="₹"
                  min={HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.min}
                  max={HOME_LOAN_ELIGIBILITY_LIMITS.existingMonthlyEMI.max}
                  step={500}
                  sliderMax={200_000}
                  value={values.existingMonthlyEMI}
                  sliderValue={liveInput.existingMonthlyEMI}
                  onValueChange={(value) => updateValue("existingMonthlyEMI", value)}
                  error={errors.existingMonthlyEMI}
                  required
                  accentClassName="accent-money"
                  helperTextVariant="tooltip"
                />

                <CalculatorSelectInput
                  id="foir-band"
                  label="FOIR band"
                  description="How much of your income lenders may assume can go toward all EMIs."
                  value={values.foirBand}
                  onValueChange={(value) => updateValue("foirBand", value)}
                  options={FOIR_BAND_OPTIONS}
                  error={errors.foirBand}
                  required
                  helperTextVariant="tooltip"
                />

                <PairedNumberSliderInput
                  id="annual-interest-rate"
                  label="Annual interest rate"
                  description="Expected annual interest rate for the home loan."
                  suffix="%"
                  min={HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.min}
                  max={HOME_LOAN_ELIGIBILITY_LIMITS.annualInterestRate.max}
                  step={0.05}
                  value={values.annualInterestRate}
                  sliderValue={liveInput.annualInterestRate}
                  onValueChange={(value) => updateValue("annualInterestRate", value)}
                  error={errors.annualInterestRate}
                  required
                  accentClassName="accent-money"
                  helperTextVariant="tooltip"
                />

                <PairedNumberSliderInput
                  id="loan-tenure"
                  label="Loan tenure"
                  description="Repayment period in years."
                  suffix="years"
                  min={HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.min}
                  max={HOME_LOAN_ELIGIBILITY_LIMITS.tenureYears.max}
                  step={1}
                  value={values.tenureYears}
                  sliderValue={liveInput.tenureYears}
                  onValueChange={(value) => updateValue("tenureYears", value)}
                  error={errors.tenureYears}
                  required
                  accentClassName="accent-money"
                  helperTextVariant="tooltip"
                />

                <PairedNumberSliderInput
                  id="own-contribution"
                  label="Own contribution / down payment"
                  description="Amount you plan to pay from your own funds."
                  prefix="₹"
                  min={HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.min}
                  max={HOME_LOAN_ELIGIBILITY_LIMITS.ownContribution.max}
                  step={10_000}
                  sliderMax={10_000_000}
                  value={values.ownContribution}
                  sliderValue={liveInput.ownContribution}
                  onValueChange={(value) => updateValue("ownContribution", value)}
                  error={errors.ownContribution}
                  required
                  accentClassName="accent-money"
                  helperTextVariant="tooltip"
                />

                <div className="rounded-lg border border-dashed border-line p-4 text-[13px] leading-6 text-muted-foreground">
                  Max eligible EMI is (net monthly income × FOIR%) minus existing EMIs. That EMI is then converted to a loan amount using <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-ink">P = EMI × [(1+r)ⁿ − 1] ÷ [r × (1+r)ⁿ]</code>, the same formula the EMI Calculator uses, solved in reverse.
                </div>

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-money-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Max eligible EMI at the {FOIR_BAND_LABELS[liveInput.foirBand]} FOIR band</p>
              <p className="font-mono text-[42px] leading-none font-bold text-money">{formatIndianCurrency(result.maxEligibleEMI)}</p>
              {result.existingEMIExceedsBudget ? (
                <p className="mt-3 rounded-lg border border-dashed border-line bg-card px-3 py-2 text-[12.5px] font-medium text-destructive">
                  Your existing monthly EMIs already exceed this FOIR band&apos;s budget, so no additional loan is eligible here. Try a higher FOIR band or reduce existing EMIs.
                </p>
              ) : null}
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <SimpleDonutChart
                  title="Loan amount vs own contribution"
                  items={[
                    { label: "Loan amount", value: result.maxEligibleLoanAmount, formattedValue: formatIndianCurrency(result.maxEligibleLoanAmount), colorClass: "bg-money", ringClass: "stroke-money" },
                    { label: "Own contribution", value: result.ownContribution, formattedValue: formatIndianCurrency(result.ownContribution), colorClass: "bg-gold", ringClass: "stroke-gold" },
                  ]}
                  showInlineLabels
                />
                <dl className="flex shrink-0 flex-row gap-6 sm:flex-col sm:gap-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Max eligible loan amount</dt>
                    <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.maxEligibleLoanAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Total property affordability</dt>
                    <dd className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalPropertyAffordability)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="home-loan-eligibility" category="loans" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Compare FOIR bands" description="See what the Conservative, Standard, and Aggressive presets would each give you for the same income, obligations, rate, and tenure.">
          <DataTable caption="Max eligible EMI, loan amount, and property affordability by FOIR band" rows={bandComparison} columns={comparisonColumns} />
          <p className="mt-3 text-sm text-muted-foreground">A higher FOIR band assumes more of your income can go toward EMIs, which raises the eligible EMI and loan amount but leaves less monthly income unallocated. This is an estimate, not a loan sanction — actual eligibility depends on the lender&apos;s own policy and underwriting.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
