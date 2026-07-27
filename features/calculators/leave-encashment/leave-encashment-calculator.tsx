"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatIndianCurrency, formatIndianNumber } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateLeaveEncashment } from "./calculate-leave-encashment"
import { createLeaveEncashmentResultText, describeLeaveEncashmentBindingConstraint } from "./leave-encashment-content"
import { toLiveInput } from "./leave-encashment-live-input"
import { LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR, LEAVE_ENCASHMENT_STATUTORY_LIMIT } from "./leave-encashment-regulatory-config"
import { LEAVE_ENCASHMENT_LIMITS, MARGINAL_TAX_RATE_OPTIONS, parseAndValidateLeaveEncashmentForm, type LeaveEncashmentFormValues } from "./leave-encashment-schema"
import type { LeaveEncashmentInput, LeaveEncashmentValidationErrors } from "./leave-encashment-types"
import { buildLeaveEncashmentCalculatorUrl, LEAVE_ENCASHMENT_DEFAULT_INPUT, parseLeaveEncashmentUrlState } from "./leave-encashment-url-state"

const EMPLOYEE_TYPE_OPTIONS = [
  { label: "Non-government", value: "non-government" },
  { label: "Government (Central/State)", value: "government" },
]
const MARGINAL_TAX_RATE_SELECT_OPTIONS = MARGINAL_TAX_RATE_OPTIONS.map((option) => ({ label: option.label, value: String(option.value) }))

function toFormValues(input: LeaveEncashmentInput): LeaveEncashmentFormValues {
  return {
    employeeType: input.employeeType,
    lastDrawnBasicSalary: String(input.lastDrawnBasicSalary),
    averageMonthlySalary: String(input.averageMonthlySalary),
    leaveEncashmentAmountReceived: String(input.leaveEncashmentAmountReceived),
    leaveDaysEncashed: String(input.leaveDaysEncashed),
    yearsOfCompletedService: String(input.yearsOfCompletedService),
    leaveDaysEarnedPerYear: String(input.leaveDaysEarnedPerYear),
    marginalTaxRate: String(input.marginalTaxRate),
  }
}

export function LeaveEncashmentCalculator() {
  const [values, setValues] = useState<LeaveEncashmentFormValues>(() => toFormValues(LEAVE_ENCASHMENT_DEFAULT_INPUT))
  const [errors, setErrors] = useState<LeaveEncashmentValidationErrors>({})

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseLeaveEncashmentUrlState(search)))
  })

  function update(field: keyof LeaveEncashmentFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateLeaveEncashmentForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildLeaveEncashmentCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(LEAVE_ENCASHMENT_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/leave-encashment-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateLeaveEncashment(liveInput), [liveInput])
  useTrackCalculationCompleted("leave-encashment", "taxes", result)
  const isGovernment = liveInput.employeeType === "government"

  const shareUrl = buildLeaveEncashmentCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createLeaveEncashmentResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Leave encashment details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <CalculatorSelectInput
                  id="employee-type"
                  label="Employee type"
                  description="Government employees get full exemption with no ceiling. Every other employee uses the least-of-four calculation below."
                  value={values.employeeType}
                  onValueChange={(value) => update("employeeType", value)}
                  options={EMPLOYEE_TYPE_OPTIONS}
                  error={errors.employeeType}
                  required
                />
                <PairedNumberSliderInput
                  id="leave-encashment-amount-received"
                  label="Leave encashment amount received"
                  description="The total lump-sum amount actually paid for encashed leave."
                  prefix="₹"
                  min={LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.min}
                  max={LEAVE_ENCASHMENT_LIMITS.leaveEncashmentAmountReceived.max}
                  step={1_000}
                  sliderMin={0}
                  sliderMax={5_000_000}
                  value={values.leaveEncashmentAmountReceived}
                  sliderValue={liveInput.leaveEncashmentAmountReceived}
                  onValueChange={(value) => update("leaveEncashmentAmountReceived", value)}
                  error={errors.leaveEncashmentAmountReceived}
                  required
                  accentClassName="accent-cat-tax"
                />
                <PairedNumberSliderInput
                  id="last-drawn-basic-salary"
                  label="Last-drawn basic + DA salary (monthly)"
                  description="Not gross salary or CTC — basic pay plus dearness allowance only. Used for the leave-at-credit daily rate."
                  prefix="₹"
                  min={LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.min}
                  max={LEAVE_ENCASHMENT_LIMITS.lastDrawnBasicSalary.max}
                  step={100}
                  sliderMin={0}
                  sliderMax={500_000}
                  value={values.lastDrawnBasicSalary}
                  sliderValue={liveInput.lastDrawnBasicSalary}
                  onValueChange={(value) => update("lastDrawnBasicSalary", value)}
                  error={errors.lastDrawnBasicSalary}
                  required
                  accentClassName="accent-cat-tax"
                />
                <PairedNumberSliderInput
                  id="average-monthly-salary"
                  label="10-month average salary (monthly)"
                  description="Average basic + DA over the 10 months immediately before retirement or resignation."
                  prefix="₹"
                  min={LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.min}
                  max={LEAVE_ENCASHMENT_LIMITS.averageMonthlySalary.max}
                  step={100}
                  sliderMin={0}
                  sliderMax={500_000}
                  value={values.averageMonthlySalary}
                  sliderValue={liveInput.averageMonthlySalary}
                  onValueChange={(value) => update("averageMonthlySalary", value)}
                  error={errors.averageMonthlySalary}
                  required
                  accentClassName="accent-cat-tax"
                />
                <PairedNumberSliderInput
                  id="leave-days-encashed"
                  label="Leave days encashed"
                  description="Total number of unused leave days actually encashed."
                  suffix="days"
                  min={LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.min}
                  max={LEAVE_ENCASHMENT_LIMITS.leaveDaysEncashed.max}
                  step={1}
                  sliderMin={0}
                  sliderMax={900}
                  value={values.leaveDaysEncashed}
                  sliderValue={liveInput.leaveDaysEncashed}
                  onValueChange={(value) => update("leaveDaysEncashed", value)}
                  error={errors.leaveDaysEncashed}
                  required
                  accentClassName="accent-cat-tax"
                />
                <PairedNumberSliderInput
                  id="years-of-completed-service"
                  label="Years of completed service"
                  suffix="years"
                  min={LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.min}
                  max={LEAVE_ENCASHMENT_LIMITS.yearsOfCompletedService.max}
                  step={1}
                  value={values.yearsOfCompletedService}
                  sliderValue={liveInput.yearsOfCompletedService}
                  onValueChange={(value) => update("yearsOfCompletedService", value)}
                  error={errors.yearsOfCompletedService}
                  required
                  accentClassName="accent-cat-tax"
                />
                <PairedNumberSliderInput
                  id="leave-days-earned-per-year"
                  label="Leave days earned per year"
                  description={`Your employer's annual leave-earning rate. At most ${LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR} per year count toward the leave-at-credit component.`}
                  suffix="days/year"
                  min={LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.min}
                  max={LEAVE_ENCASHMENT_LIMITS.leaveDaysEarnedPerYear.max}
                  step={1}
                  value={values.leaveDaysEarnedPerYear}
                  sliderValue={liveInput.leaveDaysEarnedPerYear}
                  onValueChange={(value) => update("leaveDaysEarnedPerYear", value)}
                  error={errors.leaveDaysEarnedPerYear}
                  required
                  accentClassName="accent-cat-tax"
                />
                <CalculatorSelectInput
                  id="marginal-tax-rate"
                  label="Your marginal tax rate"
                  description="Illustrative only — used for the estimated tax and net-after-tax figures, not the exemption formula itself."
                  value={values.marginalTaxRate}
                  onValueChange={(value) => update("marginalTaxRate", value)}
                  options={MARGINAL_TAX_RATE_SELECT_OPTIONS}
                  error={errors.marginalTaxRate}
                  required
                />
                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  <strong>Narrow scope:</strong> this estimates the section 10(10AA) exemption for leave encashed at retirement or resignation only. It does not cover leave encashed while still in service (fully taxable), verify your leave balance, or compute your overall tax liability.
                </div>
                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-tax-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Exempt amount</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-tax">{formatIndianCurrency(result.exemptAmount)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">of {formatIndianCurrency(liveInput.leaveEncashmentAmountReceived)} received — binding constraint: {describeLeaveEncashmentBindingConstraint(result.bindingConstraint)}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Taxable amount</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.taxableAmount)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated tax ({formatIndianNumber(result.marginalTaxRate)}%)</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.estimatedTaxOnTaxableAmount)}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated net amount after tax</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.netAmountAfterTax)}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="leave-encashment" category="taxes" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2" data-calculation-experience>
        <Card>
          <CardContent>
            <SimpleDonutChart
              title="Exempt vs taxable"
              items={[
                { label: "Exempt", value: result.exemptAmount, formattedValue: formatIndianCurrency(result.exemptAmount), colorClass: "bg-money", ringClass: "stroke-money" },
                { label: "Taxable", value: result.taxableAmount, formattedValue: formatIndianCurrency(result.taxableAmount), colorClass: "bg-gold", ringClass: "stroke-gold" },
              ]}
            />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{isGovernment ? "Government employees receive full exemption, so the entire circle represents the exempt amount." : "Non-government employees are exempt up to whichever of the four components is smallest."}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">How the exemption was calculated</CardTitle></CardHeader>
          <CardContent>
            {isGovernment ? (
              <p className="text-sm leading-6 text-muted-foreground">As a Government employee, the full amount received is exempt under section 10(10AA)(i), with no statutory ceiling. The least-of-four calculation below only applies to non-government employees.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">The exempt amount is the smallest of these four figures:</p>
                <dl className="mt-4 divide-y">
                  {([
                    ["Actual amount received", result.componentActualReceived, "actual-received"],
                    ["10-month average salary × 10", result.componentTenMonthAverageSalary, "ten-month-average"],
                    [`Leave at credit (${formatIndianNumber(result.eligibleLeaveDaysForCredit)} days)`, result.componentLeaveAtCredit, "leave-at-credit"],
                    ["Statutory limit", result.componentStatutoryLimit, "statutory-limit"],
                  ] as const).map(([label, value, key]) => (
                    <div key={key} className={`flex items-center justify-between gap-4 py-2 ${result.bindingConstraint === key ? "font-semibold text-cat-tax" : ""}`}>
                      <dt>{label}{result.bindingConstraint === key ? " (least)" : ""}</dt>
                      <dd className="font-mono">{formatIndianCurrency(value)}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6" data-calculation-experience>
        <CollapsibleSection title="Detailed exemption-formula breakdown" description="A step-by-step view of every intermediate figure used in the calculation above.">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Statutory capped leave days (min(earned/year, {LEAVE_ENCASHMENT_MAX_LEAVE_DAYS_PER_YEAR}) × years)</dt><dd className="font-mono text-base font-medium">{formatIndianNumber(result.statutoryCappedLeaveDays)} days</dd></div>
            <div><dt className="text-xs text-muted-foreground">Eligible leave days for credit (min of encashed and capped)</dt><dd className="font-mono text-base font-medium">{formatIndianNumber(result.eligibleLeaveDaysForCredit)} days</dd></div>
            <div><dt className="text-xs text-muted-foreground">Daily salary rate (last-drawn ÷ 30)</dt><dd className="font-mono text-base font-medium">{formatIndianCurrency(result.dailySalaryRate)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Current statutory limit</dt><dd className="font-mono text-base font-medium">{formatIndianCurrency(LEAVE_ENCASHMENT_STATUTORY_LIMIT)}</dd></div>
          </dl>
        </CollapsibleSection>
      </div>
    </div>
  )
}
