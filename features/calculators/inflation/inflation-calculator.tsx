"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { NoDonutResultCard } from "@/components/calculators/no-donut-result-card"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateInflation } from "./calculate-inflation"
import { INFLATION_LIMITS, parseAndValidateInflationForm, type InflationFormValues } from "./inflation-schema"
import type { InflationInput, InflationMode, InflationScheduleRow, InflationValidationErrors } from "./inflation-types"
import { buildInflationCalculatorUrl, INFLATION_DEFAULT_INPUT, parseInflationUrlState } from "./inflation-url-state"

const AMOUNT_QUICK_AMOUNTS = [
  { label: "50K", value: "50000" },
  { label: "1L", value: "100000" },
  { label: "5L", value: "500000" },
  { label: "10L", value: "1000000" },
]

const scheduleColumns: readonly DataTableColumn<InflationScheduleRow>[] = [
  { header: "Year", cell: (row) => row.year },
  { header: "Cumulative factor", cell: (row) => `${row.cumulativeFactor.toFixed(4)}×` },
  { header: "Equivalent value", cell: (row) => formatIndianCurrency(row.equivalentValue) },
]

function toFormValues(input: InflationInput): InflationFormValues {
  return { mode: input.mode, amount: String(input.amount), annualInflationRate: String(input.annualInflationRate), years: String(input.years) }
}

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function isInflationMode(value: string): value is InflationMode {
  return value === "futureCost" || value === "presentValue"
}

/** Only "futureCost" mode can compound a current amount past a safe range: at the field maximums
 * (₹10cr amount, 50% rate, 50 years) the projected future cost reaches roughly 6.4e16, well past
 * Number.MAX_SAFE_INTEGER — and calculateInflation throws on a value its own validator rejects (see
 * inflation-schema.ts's "safe calculation range" check), so live recalculation needs the same kind
 * of live-preview-only backoff CAGR/Step-up SIP use. "presentValue" mode only ever discounts an
 * amount down, so it can't overflow and is left untouched. Shrinks years (the schema's own named
 * culprit for this check) one year at a time — the range is at most 50, so this is cheap. */
function clampInflationForSafety(input: InflationInput): InflationInput {
  if (input.mode !== "futureCost" || input.amount <= 0) return input
  const projected = (years: number) => input.amount * Math.pow(1 + input.annualInflationRate / 100, years)
  let years = input.years
  while (years > INFLATION_LIMITS.years.min && (!Number.isFinite(projected(years)) || projected(years) > Number.MAX_SAFE_INTEGER)) {
    years -= 1
  }
  return years === input.years ? input : { ...input, years }
}

/** Best-effort live view of the current form text, clamped into range, so the result panel can
 * update on every keystroke/slider move instead of waiting for a valid, submitted form. */
function toLiveInput(values: InflationFormValues): InflationInput {
  const mode: InflationMode = isInflationMode(values.mode) ? values.mode : "futureCost"
  return clampInflationForSafety({
    mode,
    amount: clampFinite(Number(values.amount), INFLATION_DEFAULT_INPUT.amount, INFLATION_LIMITS.amount.min, INFLATION_LIMITS.amount.max),
    annualInflationRate: clampFinite(Number(values.annualInflationRate), INFLATION_DEFAULT_INPUT.annualInflationRate, INFLATION_LIMITS.annualInflationRate.min, INFLATION_LIMITS.annualInflationRate.max),
    years: Math.round(clampFinite(Number(values.years), INFLATION_DEFAULT_INPUT.years, INFLATION_LIMITS.years.min, INFLATION_LIMITS.years.max)),
  })
}

export function InflationCalculator() {
  const [values, setValues] = useState<InflationFormValues>(() => toFormValues(INFLATION_DEFAULT_INPUT))
  const [errors, setErrors] = useState<InflationValidationErrors>({})

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toFormValues(parseInflationUrlState(search)))
  })

  function updateValue(field: keyof InflationFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateInflationForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildInflationCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(INFLATION_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/inflation-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateInflation(liveInput), [liveInput])
  useTrackCalculationCompleted("inflation", "investments", result)
  const isFutureCost = liveInput.mode === "futureCost"
  const amountLabel = isFutureCost ? "Current amount" : "Future amount"
  const primaryLabel = isFutureCost ? "Equivalent future cost" : "Present value (today's purchasing power)"
  const primaryValue = result.mode === "futureCost" ? result.futureValue : result.presentValue
  const secondaryLabel = isFutureCost ? "Total inflation impact" : "Purchasing power change"
  const secondaryValue = result.mode === "futureCost" ? result.totalInflationImpact : result.purchasingPowerChange
  const multipleLabel = isFutureCost ? "Inflation multiple" : "Discount multiple"
  const multipleValue = result.mode === "futureCost" ? result.inflationMultiple : result.discountMultiple
  const subtitle = `from ${formatIndianCurrency(liveInput.amount)} (${amountLabel.toLowerCase()}) over ${liveInput.years} years at ${liveInput.annualInflationRate.toFixed(1)}% p.a.`

  const shareUrl = buildInflationCalculatorUrl(liveInput, siteConfig.url)
  const resultText = [
    "ThinkCalculator Inflation Estimate",
    `Mode: ${isFutureCost ? "Future cost" : "Present value / purchasing power"}`,
    `${amountLabel}: ${formatIndianCurrency(liveInput.amount)}`,
    `Assumed annual inflation rate: ${formatPercentage(liveInput.annualInflationRate)}`,
    `Duration: ${liveInput.years} years`,
    `${primaryLabel}: ${formatIndianCurrency(primaryValue)}`,
    isFutureCost
      ? `Total inflation impact: ${formatIndianCurrency(secondaryValue)}`
      : `Purchasing power change: ${formatIndianCurrency(secondaryValue)} (${formatPercentage(result.mode === "presentValue" ? result.purchasingPowerChangePercentage : 0)})`,
    "This is an illustrative assumption, not an economic forecast or CPI-linked data. It excludes Cost Inflation Index and other tax-indexation rules.",
    "",
    "Calculator:",
    `${siteConfig.url}/finance/inflation-calculator`,
  ].join("\n")

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Inflation details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <CalculatorSelectInput id="mode" label="Calculation mode" value={values.mode} onValueChange={(value) => updateValue("mode", value)} options={[{ label: "Future cost", value: "futureCost" }, { label: "Present value / purchasing power", value: "presentValue" }]} error={errors.mode} required />

                <div>
                  <PairedNumberSliderInput
                    id="amount"
                    label={amountLabel}
                    prefix="₹"
                    min={INFLATION_LIMITS.amount.min}
                    max={INFLATION_LIMITS.amount.max}
                    step={1_000}
                    sliderMin={1_000}
                    sliderMax={10_000_000}
                    value={values.amount}
                    sliderValue={liveInput.amount}
                    onValueChange={(value) => updateValue("amount", value)}
                    error={errors.amount}
                    required
                    accentClassName="accent-cat-invest"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {AMOUNT_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("amount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <PairedNumberSliderInput
                  id="rate"
                  label="Assumed annual inflation rate"
                  description="A negative value models deflation. This is a modelling assumption, not official CPI data."
                  suffix="%"
                  min={INFLATION_LIMITS.annualInflationRate.min}
                  max={INFLATION_LIMITS.annualInflationRate.max}
                  step={0.1}
                  value={values.annualInflationRate}
                  sliderValue={liveInput.annualInflationRate}
                  onValueChange={(value) => updateValue("annualInflationRate", value)}
                  error={errors.annualInflationRate}
                  required
                  accentClassName="accent-cat-invest"
                />

                <PairedNumberSliderInput
                  id="years"
                  label="Duration"
                  suffix="years"
                  min={INFLATION_LIMITS.years.min}
                  max={INFLATION_LIMITS.years.max}
                  step={1}
                  value={values.years}
                  sliderValue={liveInput.years}
                  onValueChange={(value) => updateValue("years", value)}
                  error={errors.years}
                  required
                  accentClassName="accent-cat-invest"
                />

                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <NoDonutResultCard
          gradientFromClassName="from-cat-invest-soft"
          headlineLabel={primaryLabel}
          headlineValue={formatIndianCurrency(primaryValue)}
          headlineValueColorClassName="text-cat-invest"
          subtitle={subtitle}
          stats={[
            { label: secondaryLabel, value: formatIndianCurrency(secondaryValue) },
            { label: multipleLabel, value: `${multipleValue.toFixed(4)}×` },
          ]}
        >
          <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="inflation" category="investments" />
        </NoDonutResultCard>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{isFutureCost ? "Current versus future value" : "Future versus present value"}</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">{amountLabel}</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(liveInput.amount)}</dd></div>
              <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">{primaryLabel}</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(primaryValue)}</dd></div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">This comparison shows only the endpoints. The year-by-year path below shows the same erosion or growth spread across every intermediate year.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8" data-calculation-experience>
        <CollapsibleSection title="Year-by-year schedule" description={isFutureCost ? "Each row shows the equivalent cost if the same amount were needed in that year instead of today." : "Each row shows what the future amount would be worth in today's purchasing power if received in that year instead."}>
          <DataTable caption={isFutureCost ? "Inflation future cost schedule" : "Inflation present value schedule"} rows={result.schedule} columns={scheduleColumns} initialRows={15} />
          <p className="mt-3 text-sm text-muted-foreground">Displayed currency is rounded; calculations retain precision.</p>
        </CollapsibleSection>
      </div>
    </div>
  )
}
