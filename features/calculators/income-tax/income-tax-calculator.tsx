"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateIncomeTax, compareRegimes } from "@/lib/tax/engine"
import type { TaxCalcInput, TaxCalculationResult, TaxRegime } from "@/lib/tax/types"
import { cn } from "@/lib/utils"
import { buildBestEffortComparisonInput, INCOME_TAX_DEFAULT_FORM_VALUES, parseAndValidateIncomeTaxForm } from "./income-tax-schema"
import { INCOME_TAX_FINANCIAL_YEAR } from "./income-tax-regulatory-config"
import type { IncomeTaxFormErrors, IncomeTaxFormValues } from "./income-tax-types"
import { buildIncomeTaxCalculatorUrl, parseIncomeTaxUrlState } from "./income-tax-url-state"
import { IncomeTaxRebateSurchargeCard, IncomeTaxResultSummary, IncomeTaxSlabBreakdownSection } from "./income-tax-results"

const ageBandOptions = [
  { label: "Below 60", value: "below60" },
  { label: "60 to 80 (senior citizen)", value: "60to80" },
  { label: "80 and above (super senior citizen)", value: "80plus" },
]

function createResultText(input: TaxCalcInput, result: TaxCalculationResult): string {
  return [
    "ThinkCalculator Income Tax Calculation",
    "",
    `Regime: ${input.regime === "old" ? "Old Regime" : "New Regime"}`,
    `Gross income: ${formatIndianCurrency(input.grossIncome)}`,
    `Taxable income: ${formatIndianCurrency(result.taxableIncome)}`,
    `Tax before rebate: ${formatIndianCurrency(result.taxBeforeRebate)}`,
    `Section 87A rebate: ${formatIndianCurrency(result.rebate87A.rebateAmount)}`,
    `Surcharge: ${formatIndianCurrency(result.surcharge.surcharge)}`,
    `Cess: ${formatIndianCurrency(result.cess)}`,
    `Total tax liability: ${formatIndianCurrency(result.totalTaxLiability)}`,
    "",
    "Calculator:",
    `${siteConfig.url}/finance/income-tax-calculator`,
  ].join("\n")
}

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

function RegimeComparisonCallout({ values }: { readonly values: IncomeTaxFormValues }) {
  const comparison = useMemo(() => {
    const comparisonInput = buildBestEffortComparisonInput(values)
    if (!comparisonInput) return null
    try {
      return compareRegimes(comparisonInput, INCOME_TAX_FINANCIAL_YEAR)
    } catch {
      return null
    }
  }, [values])

  if (!comparison) return null

  const currentTax = values.regime === "old" ? comparison.oldRegime.totalTaxLiability : comparison.newRegime.totalTaxLiability
  const otherTax = values.regime === "old" ? comparison.newRegime.totalTaxLiability : comparison.oldRegime.totalTaxLiability
  const otherRegimeLabel = values.regime === "old" ? "New Regime" : "Old Regime"
  const difference = otherTax - currentTax

  return (
    <p className="mt-2 text-sm leading-6 text-muted-foreground" aria-live="polite">
      {difference === 0
        ? `Tax is the same under both regimes at these figures: ${formatIndianCurrency(currentTax)}.`
        : `You'd pay ${formatIndianCurrency(Math.abs(difference))} ${difference > 0 ? "more" : "less"} under the ${otherRegimeLabel} at these figures.`}
    </p>
  )
}

export function IncomeTaxCalculator() {
  const [values, setValues] = useState<IncomeTaxFormValues>(INCOME_TAX_DEFAULT_FORM_VALUES)
  const [errors, setErrors] = useState<IncomeTaxFormErrors>({})
  const [calculation, setCalculation] = useState<{ input: TaxCalcInput; result: TaxCalculationResult; date: string } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = new URLSearchParams(window.location.search)
      const parsedValues = parseIncomeTaxUrlState(search)
      setValues(parsedValues)
      const validation = parseAndValidateIncomeTaxForm(parsedValues)
      if (validation.success) {
        setCalculation({
          input: validation.data,
          result: calculateIncomeTax(validation.data, INCOME_TAX_FINANCIAL_YEAR),
          date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()),
        })
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function switchRegime(regime: TaxRegime) {
    setValues((current) => ({ ...current, regime }))
    setErrors({})
    setCalculation(null)
  }

  function updateShared(field: "grossIncome" | "ageBand", value: string) {
    setValues((current) => ({ ...current, [field]: value }) as IncomeTaxFormValues)
    setErrors((current) => ({ ...current, [field]: undefined }))
    setCalculation(null)
  }

  function updateOldDeduction(field: keyof IncomeTaxFormValues["oldRegimeDeductions"], value: string) {
    setValues((current) => ({ ...current, oldRegimeDeductions: { ...current.oldRegimeDeductions, [field]: value } }))
    setErrors((current) => ({ ...current, deductions: { ...current.deductions, [field]: undefined } }))
    setCalculation(null)
  }

  function updateNewDeduction(field: keyof IncomeTaxFormValues["newRegimeDeductions"], value: string) {
    setValues((current) => ({ ...current, newRegimeDeductions: { ...current.newRegimeDeductions, [field]: value } }))
    setErrors((current) => ({ ...current, deductions: { ...current.deductions, [field]: undefined } }))
    setCalculation(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateIncomeTaxForm(values)
    if (!validation.success) {
      setErrors(validation.errors)
      setCalculation(null)
      return
    }
    const result = calculateIncomeTax(validation.data, INCOME_TAX_FINANCIAL_YEAR)
    setErrors({})
    setCalculation({ input: validation.data, result, date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    window.history.replaceState(null, "", buildIncomeTaxCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(INCOME_TAX_DEFAULT_FORM_VALUES)
    setErrors({})
    setCalculation(null)
    window.history.replaceState(null, "", "/finance/income-tax-calculator")
  }

  const isOld = values.regime === "old"
  const shareUrl = calculation ? buildIncomeTaxCalculatorUrl(calculation.input, siteConfig.url) : ""
  const resultText = calculation ? createResultText(calculation.input, calculation.result) : ""
  const deductionErrors = errors.deductions ?? {}

  return (
    <>
      <div data-calculator-form>
        <CalculatorShell title="Calculate income tax" description="Choose a regime, enter your income and deductions, then calculate your full tax breakdown.">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <RegimeToggle value={values.regime} onChange={switchRegime} />
              {errors.regime ? (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {errors.regime}
                </p>
              ) : null}
              <RegimeComparisonCallout values={values} />
            </div>

            <CalculatorNumberInput
              id="gross-income"
              label="Gross income"
              description="Enter your total gross income for the financial year."
              prefix="₹"
              min={0}
              step={10_000}
              value={values.grossIncome}
              onValueChange={(value) => updateShared("grossIncome", value)}
              error={errors.grossIncome}
              required
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
                <CalculatorNumberInput id="section-80c" label="Section 80C" description="PF, ELSS, life insurance, and similar investments." prefix="₹" min={0} step={1_000} value={values.oldRegimeDeductions.section80C} onValueChange={(value) => updateOldDeduction("section80C", value)} error={deductionErrors.section80C} />
                <CalculatorNumberInput id="section-80d" label="Section 80D" description="Health insurance premium paid for self and family." prefix="₹" min={0} step={1_000} value={values.oldRegimeDeductions.section80D} onValueChange={(value) => updateOldDeduction("section80D", value)} error={deductionErrors.section80D} />
                <CalculatorNumberInput id="hra-exemption" label="HRA exemption" description="Enter your already-calculated HRA exemption amount, not your full HRA received." prefix="₹" min={0} step={1_000} value={values.oldRegimeDeductions.hraExemption} onValueChange={(value) => updateOldDeduction("hraExemption", value)} error={deductionErrors.hraExemption} />
                <CalculatorNumberInput id="home-loan-interest-24b" label="Home loan interest (24b)" description="Self-occupied property home loan interest." prefix="₹" min={0} step={1_000} value={values.oldRegimeDeductions.homeLoanInterestSection24b} onValueChange={(value) => updateOldDeduction("homeLoanInterestSection24b", value)} error={deductionErrors.homeLoanInterestSection24b} />
                <CalculatorNumberInput id="other-80-deductions" label="Other Section 80 deductions" description="80E, 80G, 80TTA, and similar provisions." prefix="₹" min={0} step={1_000} value={values.oldRegimeDeductions.otherSection80Deductions} onValueChange={(value) => updateOldDeduction("otherSection80Deductions", value)} error={deductionErrors.otherSection80Deductions} />
              </>
            ) : (
              <CalculatorNumberInput id="employer-nps-80ccd2" label="Employer NPS contribution (80CCD(2))" description="Enter the amount already capped at 14% of basic salary plus DA." prefix="₹" min={0} step={1_000} value={values.newRegimeDeductions.employerNpsSection80CCD2} onValueChange={(value) => updateNewDeduction("employerNpsSection80CCD2", value)} error={deductionErrors.employerNpsSection80CCD2} />
            )}

            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
              <strong>Narrow scope:</strong> this applies regular slab-rate income only. Capital gains, other special-rate income, TDS, and advance tax are not modelled. Verify against official sources or consult a qualified professional before filing.
            </div>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Button className="flex-1" size="lg" type="submit">Calculate tax</Button>
              <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
            </div>
          </form>
        </CalculatorShell>
      </div>

      <div className="space-y-6" aria-label="Calculator results">
        <IncomeTaxResultSummary result={calculation?.result ?? null} />
        {calculation ? (
          <>
            <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            <IncomeTaxRebateSurchargeCard result={calculation.result} />
            <CalculationSummary
              title="ThinkCalculator Income Tax Calculation"
              calculationDate={calculation.date}
              disclaimer="This is an estimate for informational purposes only. It does not account for TDS, advance tax, capital gains, or other special-rate income. Verify against official sources or consult a qualified professional before filing."
              items={[
                { label: "Regime", value: calculation.input.regime === "old" ? "Old Regime" : "New Regime" },
                { label: "Gross income", value: formatIndianCurrency(calculation.input.grossIncome) },
                { label: "Taxable income", value: formatIndianCurrency(calculation.result.taxableIncome) },
                { label: "Tax before rebate", value: formatIndianCurrency(calculation.result.taxBeforeRebate) },
                { label: "Section 87A rebate", value: formatIndianCurrency(calculation.result.rebate87A.rebateAmount) },
                { label: "Surcharge", value: formatIndianCurrency(calculation.result.surcharge.surcharge) },
                { label: "Cess", value: formatIndianCurrency(calculation.result.cess) },
                { label: "Total tax liability", value: formatIndianCurrency(calculation.result.totalTaxLiability) },
              ]}
            />
          </>
        ) : null}
      </div>

      {calculation ? <IncomeTaxSlabBreakdownSection result={calculation.result} /> : null}
    </>
  )
}
