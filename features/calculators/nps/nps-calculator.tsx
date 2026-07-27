"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { GrowthLineChart, MilestoneRow, pickMilestoneIndices, type MilestoneItem } from "@/components/calculators/growth-area-chart"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateNPS } from "./calculate-nps"
import { createNPSResultText } from "./nps-content"
import { toLiveInput } from "./nps-live-input"
import { NPS_LIMITS, parseAndValidateNPSForm, type NPSFormValues } from "./nps-schema"
import type { NPSInput, NPSResult, NPSScheduleRow, NPSValidationErrors } from "./nps-types"
import { buildNPSCalculatorUrl, NPS_DEFAULT_INPUT, parseNPSUrlState } from "./nps-url-state"

function toFormValues(input: NPSInput): NPSFormValues {
  return {
    monthlyContribution: String(input.monthlyContribution),
    currentAge: String(input.currentAge),
    retirementAge: String(input.retirementAge),
    equityAllocationPercent: String(input.equityAllocationPercent),
    corporateDebtAllocationPercent: String(input.corporateDebtAllocationPercent),
    equityExpectedReturn: String(input.equityExpectedReturn),
    corporateDebtExpectedReturn: String(input.corporateDebtExpectedReturn),
    govtSecuritiesExpectedReturn: String(input.govtSecuritiesExpectedReturn),
  }
}

function toGrowthPoints(schedule: readonly NPSScheduleRow[]) {
  return schedule.map((row) => ({ label: `Age ${row.age}`, invested: row.cumulativeInvestment, value: row.yearEndBalance }))
}

function toMilestoneItems(schedule: readonly NPSScheduleRow[], result: NPSResult): readonly MilestoneItem[] {
  const indices = pickMilestoneIndices(schedule.length)
  return [
    ...indices.map((index) => ({ label: `Age ${schedule[index].age}`, value: formatIndianCurrency(schedule[index].yearEndBalance) })),
    { label: "Estimated growth", value: formatIndianCurrency(result.totalGrowth), highlight: true },
  ]
}

const scheduleColumns: readonly DataTableColumn<NPSScheduleRow>[] = [
  { header: "Age", cell: (row) => row.age },
  { header: "Contribution this year", cell: (row) => formatIndianCurrency(row.contribution) },
  { header: "Cumulative investment", cell: (row) => formatIndianCurrency(row.cumulativeInvestment) },
  { header: "Year-end balance", cell: (row) => formatIndianCurrency(row.yearEndBalance) },
  { header: "Gain to date", cell: (row) => formatIndianCurrency(row.gainToDate) },
]

export function NPSCalculator() {
  const [values, setValues] = useState<NPSFormValues>(() => toFormValues(NPS_DEFAULT_INPUT))
  const [errors, setErrors] = useState<NPSValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseNPSUrlState(search)))
  })

  function updateValue(field: keyof NPSFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateNPSForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildNPSCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(NPS_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/nps-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateNPS(liveInput), [liveInput])
  useTrackCalculationCompleted("nps", "investments", result)
  const yearsToRetirement = liveInput.retirementAge - liveInput.currentAge
  const growthPoints = useMemo(() => toGrowthPoints(result.schedule), [result.schedule])
  const milestoneItems = useMemo(() => toMilestoneItems(result.schedule, result), [result])

  const shareUrl = buildNPSCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createNPSResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">NPS details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-8">
                <fieldset className="space-y-5">
                  <legend className="text-base font-semibold">Contribution and horizon</legend>
                  <PairedNumberSliderInput
                    id="monthly-contribution"
                    label="Monthly contribution"
                    prefix="₹"
                    min={NPS_LIMITS.monthlyContribution.min}
                    max={NPS_LIMITS.monthlyContribution.max}
                    step={500}
                    sliderMin={0}
                    sliderMax={100_000}
                    value={values.monthlyContribution}
                    sliderValue={liveInput.monthlyContribution}
                    onValueChange={(value) => updateValue("monthlyContribution", value)}
                    error={errors.monthlyContribution}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="current-age"
                    label="Current age"
                    suffix="years"
                    min={NPS_LIMITS.currentAge.min}
                    max={NPS_LIMITS.currentAge.max}
                    step={1}
                    value={values.currentAge}
                    sliderValue={liveInput.currentAge}
                    onValueChange={(value) => updateValue("currentAge", value)}
                    error={errors.currentAge}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="retirement-age"
                    label="Retirement age"
                    suffix="years"
                    min={NPS_LIMITS.retirementAge.min}
                    max={NPS_LIMITS.retirementAge.max}
                    step={1}
                    value={values.retirementAge}
                    sliderValue={liveInput.retirementAge}
                    onValueChange={(value) => updateValue("retirementAge", value)}
                    error={errors.retirementAge}
                    required
                    accentClassName="accent-cat-invest"
                  />
                </fieldset>

                <fieldset className="space-y-5 border-t pt-6">
                  <legend className="text-base font-semibold">Asset allocation</legend>
                  <PairedNumberSliderInput
                    id="equity-allocation-percent"
                    label="Equity allocation"
                    description="Government securities allocation fills the remainder automatically."
                    suffix="%"
                    min={NPS_LIMITS.equityAllocationPercent.min}
                    max={NPS_LIMITS.equityAllocationPercent.max}
                    step={1}
                    value={values.equityAllocationPercent}
                    sliderValue={liveInput.equityAllocationPercent}
                    onValueChange={(value) => updateValue("equityAllocationPercent", value)}
                    error={errors.equityAllocationPercent}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="corporate-debt-allocation-percent"
                    label="Corporate debt allocation"
                    description={`Government securities allocation: ${formatPercentage(result.govtSecuritiesAllocationPercent)}.`}
                    suffix="%"
                    min={NPS_LIMITS.corporateDebtAllocationPercent.min}
                    max={NPS_LIMITS.corporateDebtAllocationPercent.max}
                    step={1}
                    value={values.corporateDebtAllocationPercent}
                    sliderValue={liveInput.corporateDebtAllocationPercent}
                    onValueChange={(value) => updateValue("corporateDebtAllocationPercent", value)}
                    error={errors.corporateDebtAllocationPercent}
                    required
                    accentClassName="accent-cat-loans"
                  />
                </fieldset>

                <fieldset className="space-y-5 border-t pt-6">
                  <legend className="text-base font-semibold">Expected returns by asset class</legend>
                  <PairedNumberSliderInput
                    id="equity-expected-return"
                    label="Expected equity return"
                    description="A constant modelling assumption for this projection, not a forecast or guaranteed return."
                    suffix="%"
                    min={NPS_LIMITS.equityExpectedReturn.min}
                    max={NPS_LIMITS.equityExpectedReturn.max}
                    step={0.1}
                    value={values.equityExpectedReturn}
                    sliderValue={liveInput.equityExpectedReturn}
                    onValueChange={(value) => updateValue("equityExpectedReturn", value)}
                    error={errors.equityExpectedReturn}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <PairedNumberSliderInput
                    id="corporate-debt-expected-return"
                    label="Expected corporate debt return"
                    suffix="%"
                    min={NPS_LIMITS.corporateDebtExpectedReturn.min}
                    max={NPS_LIMITS.corporateDebtExpectedReturn.max}
                    step={0.1}
                    value={values.corporateDebtExpectedReturn}
                    sliderValue={liveInput.corporateDebtExpectedReturn}
                    onValueChange={(value) => updateValue("corporateDebtExpectedReturn", value)}
                    error={errors.corporateDebtExpectedReturn}
                    required
                    accentClassName="accent-cat-loans"
                  />
                  <PairedNumberSliderInput
                    id="govt-securities-expected-return"
                    label="Expected government securities return"
                    suffix="%"
                    min={NPS_LIMITS.govtSecuritiesExpectedReturn.min}
                    max={NPS_LIMITS.govtSecuritiesExpectedReturn.max}
                    step={0.1}
                    value={values.govtSecuritiesExpectedReturn}
                    sliderValue={liveInput.govtSecuritiesExpectedReturn}
                    onValueChange={(value) => updateValue("govtSecuritiesExpectedReturn", value)}
                    error={errors.govtSecuritiesExpectedReturn}
                    required
                    accentClassName="accent-cat-business"
                  />
                </fieldset>

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated corpus at retirement</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(result.corpusAtRetirement)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">over {yearsToRetirement} years at a {formatPercentage(result.blendedAnnualReturn)} blended annual return</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total contributions</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalContributions)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated growth</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalGrowth)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <SimpleDonutChart
                title="Asset allocation"
                items={[
                  { label: "Equity", value: result.equityAllocationPercent, formattedValue: formatPercentage(result.equityAllocationPercent), colorClass: "bg-cat-invest", ringClass: "stroke-cat-invest" },
                  { label: "Corporate debt", value: result.corporateDebtAllocationPercent, formattedValue: formatPercentage(result.corporateDebtAllocationPercent), colorClass: "bg-cat-loans", ringClass: "stroke-cat-loans" },
                  { label: "Govt securities", value: result.govtSecuritiesAllocationPercent, formattedValue: formatPercentage(result.govtSecuritiesAllocationPercent), colorClass: "bg-cat-business", ringClass: "stroke-cat-business" },
                ]}
              />
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="nps" category="investments" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Corpus growth over time" description="Cumulative contributions vs. estimated total value, year by year, at the blended assumed return. This projection is illustrative, not an NPS account statement.">
          <div className="flex justify-end">
            <Button type="button" variant="outline" data-print-hide onClick={() => setScheduleView((view) => (view === "chart" ? "table" : "chart"))}>{scheduleView === "chart" ? "View table" : "View chart"}</Button>
          </div>
          <div className="mt-4">
            {scheduleView === "chart" ? (
              <>
                <GrowthLineChart points={growthPoints} investedLabel="Amount contributed" valueLabel="Total value (estimated)" />
                <MilestoneRow items={milestoneItems} />
              </>
            ) : (
              <DataTable caption="Annual NPS accumulation schedule at the blended assumed return; illustrative only" rows={result.schedule} columns={scheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded for presentation; the calculation retains full numeric precision between years. Excludes Tier I/Tier II distinctions, mandatory annuitization at exit, and tax treatment.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
