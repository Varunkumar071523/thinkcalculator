"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { GrowthLineChart, MilestoneRow, pickMilestoneIndices, type MilestoneItem } from "@/components/calculators/growth-area-chart"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { YearlyBarChart, type YearlyBarChartSeries } from "@/components/calculators/yearly-bar-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatIndianCurrency } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculatePPF } from "./calculate-ppf"
import { createPPFResultText } from "./ppf-content"
import { PPF_RATE_CONFIG } from "./ppf-rate-config"
import { isPPFDuration, parseAndValidatePPFForm, PPF_LIMITS, type PPFFormValues } from "./ppf-schema"
import { PPF_DURATIONS, type PPFInput, type PPFScheduleRow, type PPFValidationErrors } from "./ppf-types"
import { buildPPFCalculatorUrl, parsePPFUrlState, PPF_DEFAULT_INPUT } from "./ppf-url-state"

const CONTRIBUTION_QUICK_AMOUNTS = [
  { label: "25K", value: "25000" },
  { label: "50K", value: "50000" },
  { label: "1L", value: "100000" },
  { label: "1.5L", value: "150000" },
]

const durationOptions = PPF_DURATIONS.map((years) => ({ label: `${years} years`, value: String(years) }))

const scheduleColumns: readonly DataTableColumn<PPFScheduleRow>[] = [
  { header: "Year", cell: (row) => row.year },
  { header: "Opening balance", cell: (row) => formatIndianCurrency(row.openingBalance) },
  { header: "Contribution", cell: (row) => formatIndianCurrency(row.contribution) },
  { header: "Interest earned", cell: (row) => formatIndianCurrency(row.interestEarned) },
  { header: "Closing balance", cell: (row) => formatIndianCurrency(row.closingBalance) },
]

function toFormValues(input: PPFInput): PPFFormValues {
  return { annualContribution: String(input.annualContribution), assumedAnnualInterestRate: String(input.assumedAnnualInterestRate), durationYears: String(input.durationYears) }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Rounds to the nearest whole-rupee multiple of the ₹500-1,50,000 field's ₹50 step, and the rate
 * to two decimal places, so live recalculation never hands calculatePPF a value its own validator
 * would reject mid-keystroke or mid-drag (annualContribution must be an exact multiple of the step;
 * assumedAnnualInterestRate allows at most two decimals) — a validity snap, distinct from the
 * overflow-safety clamps used elsewhere in this batch (PPF's bounded inputs can't overflow; see
 * calculate-ppf.ts's max ≈ ₹1.5L × 40yr × 15%, nowhere near Number.MAX_SAFE_INTEGER). */
function toLiveInput(values: PPFFormValues): PPFInput {
  const contribution = clampFinite(Number(values.annualContribution), PPF_DEFAULT_INPUT.annualContribution, PPF_LIMITS.annualContribution.min, PPF_LIMITS.annualContribution.max)
  const rate = clampFinite(Number(values.assumedAnnualInterestRate), PPF_DEFAULT_INPUT.assumedAnnualInterestRate, PPF_LIMITS.assumedAnnualInterestRate.min, PPF_LIMITS.assumedAnnualInterestRate.max)
  const parsedDuration = Number(values.durationYears)
  return {
    annualContribution: Math.round(contribution / PPF_LIMITS.annualContribution.step) * PPF_LIMITS.annualContribution.step,
    assumedAnnualInterestRate: Math.round(rate * 100) / 100,
    durationYears: isPPFDuration(parsedDuration) ? parsedDuration : PPF_DEFAULT_INPUT.durationYears,
  }
}

function toGrowthPoints(schedule: readonly PPFScheduleRow[]) {
  let invested = 0
  return schedule.map((row) => {
    invested += row.contribution
    return { label: `Yr ${row.year}`, invested, value: row.closingBalance }
  })
}

function toMilestoneItems(schedule: readonly PPFScheduleRow[], totalInterest: number): readonly MilestoneItem[] {
  const indices = pickMilestoneIndices(schedule.length)
  return [
    ...indices.map((index) => ({ label: `Year ${schedule[index].year}`, value: formatIndianCurrency(schedule[index].closingBalance) })),
    { label: "Estimated interest", value: formatIndianCurrency(totalInterest), highlight: true },
  ]
}

export function PPFCalculator() {
  const [values, setValues] = useState<PPFFormValues>(() => toFormValues(PPF_DEFAULT_INPUT))
  const [errors, setErrors] = useState<PPFValidationErrors>({})
  const [scheduleView, setScheduleView] = useState<"chart" | "table">("chart")

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parsePPFUrlState(search)))
  })

  function updateValue(field: keyof PPFFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidatePPFForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildPPFCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(PPF_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/ppf-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculatePPF(liveInput), [liveInput])
  useTrackCalculationCompleted("ppf", "savings", result)
  const growthPoints = useMemo(() => toGrowthPoints(result.schedule), [result.schedule])
  const milestoneItems = useMemo(() => toMilestoneItems(result.schedule, result.totalInterest), [result.schedule, result.totalInterest])

  const yearlyChartSeries = useMemo<readonly [YearlyBarChartSeries, YearlyBarChartSeries]>(() => [
    { label: "Contribution", values: result.schedule.map((row) => Math.round(row.contribution)), colorVar: "--money" },
    { label: "Interest", values: result.schedule.map((row) => Math.round(row.interestEarned)), colorVar: "--gold" },
  ], [result.schedule])
  const yearlyChartLabels = useMemo(() => result.schedule.map((row) => `Y${row.year}`), [result.schedule])

  const shareUrl = buildPPFCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createPPFResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">PPF details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <PairedNumberSliderInput
                    id="annual-contribution"
                    label="Annual contribution"
                    description="₹500 to ₹1,50,000, in whole-rupee multiples of ₹50."
                    prefix="₹"
                    min={PPF_LIMITS.annualContribution.min}
                    max={PPF_LIMITS.annualContribution.max}
                    step={PPF_LIMITS.annualContribution.step}
                    value={values.annualContribution}
                    sliderValue={liveInput.annualContribution}
                    onValueChange={(value) => updateValue("annualContribution", value)}
                    error={errors.annualContribution}
                    required
                    accentClassName="accent-cat-savings"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {CONTRIBUTION_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("annualContribution", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-savings hover:text-cat-savings focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="assumed-annual-rate"
                  label="Assumed annual interest rate"
                  description={`${PPF_RATE_CONFIG.defaultRate}% reference default: ${PPF_RATE_CONFIG.verifiedPeriod}. Checked ${PPF_RATE_CONFIG.checkedOn}; not a current-rate claim.`}
                  suffix="%"
                  min={PPF_LIMITS.assumedAnnualInterestRate.min}
                  max={PPF_LIMITS.assumedAnnualInterestRate.max}
                  step={0.01}
                  value={values.assumedAnnualInterestRate}
                  sliderValue={liveInput.assumedAnnualInterestRate}
                  onValueChange={(value) => updateValue("assumedAnnualInterestRate", value)}
                  error={errors.assumedAnnualInterestRate}
                  required
                  accentClassName="accent-cat-savings"
                />

                <CalculatorSelectInput id="duration" label="Projection duration" description="The selector counts projection years. Official maturity timing, extension eligibility, and applications are outside this calculator." value={values.durationYears} onValueChange={(value) => updateValue("durationYears", value)} options={durationOptions} error={errors.durationYears} required />

                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6"><strong>Projection assumptions:</strong> the entered rate stays constant, and each annual contribution is added at the beginning of the projection year. Actual PPF rates may change, and official interest eligibility is determined monthly.</div>

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-savings-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">Estimated maturity value</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-savings">{formatIndianCurrency(result.maturityValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(result.totalContributions)} contributed over {liveInput.durationYears} years at {liveInput.assumedAnnualInterestRate.toFixed(2)}% p.a.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total contributions</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalContributions)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Estimated interest</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalInterest)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <SimpleDonutChart
                title="Contributions vs interest"
                items={[
                  { label: "Contributions", value: result.totalContributions, formattedValue: formatIndianCurrency(result.totalContributions), colorClass: "bg-money", ringClass: "stroke-money" },
                  { label: "Interest", value: result.totalInterest, formattedValue: formatIndianCurrency(result.totalInterest), colorClass: "bg-gold", ringClass: "stroke-gold" },
                ]}
              />
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="ppf" category="savings" />
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10 border-t border-line pt-8" aria-labelledby="ppf-yearly-chart-heading">
        <p className="font-mono text-xs font-medium tracking-wide text-cat-savings uppercase">Growth breakdown</p>
        <h2 id="ppf-yearly-chart-heading" className="mt-2 font-serif text-2xl font-semibold tracking-tight">Contributions vs interest, year by year</h2>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Each bar is one year&apos;s contribution, split by what was deposited vs. interest earned that year. Illustrative only, not an official PPF statement.</p>
        <div className="mt-6">
          <YearlyBarChart
            labels={yearlyChartLabels}
            series={yearlyChartSeries}
            formatTooltipValue={formatIndianCurrency}
            ariaLabel="Stacked bar chart of contribution versus interest earned each year of the PPF projection"
          />
        </div>
      </section>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Growth schedule" description="Contributions vs. estimated total value, year by year. This schedule is illustrative, not an official PPF statement.">
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
              <DataTable caption="Annual PPF schedule using beginning-of-year contributions and one constant assumed rate; illustrative only" rows={result.schedule} columns={scheduleColumns} initialRows={15} />
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Displayed values are rounded for presentation; the calculation retains full numeric precision between years.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
