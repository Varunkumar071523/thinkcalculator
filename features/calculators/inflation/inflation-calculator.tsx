"use client"

import { useMemo, useState, type FormEvent } from "react"

import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
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
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateInflationForm(values)
    if (!validation.success) { setErrors(validation.errors); return }
    setErrors({})
    window.history.replaceState(null, "", buildInflationCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toFormValues(INFLATION_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/finance/inflation-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateInflation(liveInput), [liveInput])
  const isFutureCost = liveInput.mode === "futureCost"
  const amountLabel = isFutureCost ? "Current amount" : "Future amount"
  const primaryLabel = isFutureCost ? "Equivalent future cost" : "Present value (today's purchasing power)"
  const primaryValue = result.mode === "futureCost" ? result.futureValue : result.presentValue
  const secondaryLabel = isFutureCost ? "Total inflation impact" : "Purchasing power change"
  const secondaryValue = result.mode === "futureCost" ? result.totalInflationImpact : result.purchasingPowerChange
  const multipleLabel = isFutureCost ? "Inflation multiple" : "Discount multiple"
  const multipleValue = result.mode === "futureCost" ? result.inflationMultiple : result.discountMultiple

  const shareUrl = buildInflationCalculatorUrl(liveInput, siteConfig.url)
  const calculationDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())
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
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <CalculatorSelectInput id="mode" label="Calculation mode" value={values.mode} onValueChange={(value) => updateValue("mode", value)} options={[{ label: "Future cost", value: "futureCost" }, { label: "Present value / purchasing power", value: "presentValue" }]} error={errors.mode} required />

                <div>
                  <CalculatorNumberInput id="amount" label={amountLabel} prefix="₹" min={INFLATION_LIMITS.amount.min} max={INFLATION_LIMITS.amount.max} step={1_000} value={values.amount} onValueChange={(value) => updateValue("amount", value)} error={errors.amount} required />
                  <input type="range" aria-label="Amount slider" min={1_000} max={10_000_000} step={1_000} value={liveInput.amount} onChange={(event) => updateValue("amount", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                  <div className="mt-2 flex gap-1.5">
                    {AMOUNT_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => updateValue("amount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-invest hover:text-cat-invest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <CalculatorNumberInput id="rate" label="Assumed annual inflation rate" description="A negative value models deflation. This is a modelling assumption, not official CPI data." suffix="%" min={INFLATION_LIMITS.annualInflationRate.min} max={INFLATION_LIMITS.annualInflationRate.max} step={0.1} value={values.annualInflationRate} onValueChange={(value) => updateValue("annualInflationRate", value)} error={errors.annualInflationRate} required />
                  <input type="range" aria-label="Assumed annual inflation rate slider" min={INFLATION_LIMITS.annualInflationRate.min} max={INFLATION_LIMITS.annualInflationRate.max} step={0.1} value={liveInput.annualInflationRate} onChange={(event) => updateValue("annualInflationRate", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div>
                  <CalculatorNumberInput id="years" label="Duration" suffix="years" min={INFLATION_LIMITS.years.min} max={INFLATION_LIMITS.years.max} step={1} value={values.years} onValueChange={(value) => updateValue("years", value)} error={errors.years} required />
                  <input type="range" aria-label="Duration slider" min={INFLATION_LIMITS.years.min} max={INFLATION_LIMITS.years.max} step={1} value={liveInput.years} onChange={(event) => updateValue("years", event.target.value)} className="mt-2.5 h-1 w-full cursor-pointer accent-cat-invest" />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1" size="lg" type="submit">Calculate inflation impact</Button>
                  <Button className="flex-1" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-invest-soft to-card to-55%" data-testid="calculator-result-card" aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">{primaryLabel}</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-invest">{formatIndianCurrency(primaryValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">from {formatIndianCurrency(liveInput.amount)} ({amountLabel.toLowerCase()}) over {liveInput.years} years at {liveInput.annualInflationRate.toFixed(1)}% p.a.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">{secondaryLabel}</p>
                <p className="font-mono text-lg font-semibold">{formatIndianCurrency(secondaryValue)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">{multipleLabel}</p>
                <p className="font-mono text-lg font-semibold">{multipleValue.toFixed(4)}×</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} />
            </div>
          </CardContent>
        </Card>
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

      <div className="mt-6">
        <CalculationSummary
          title="ThinkCalculator Inflation Estimate"
          calculationDate={calculationDate}
          disclaimer="This is an illustrative assumption, not an economic forecast or CPI-linked data. It excludes Cost Inflation Index and other tax-indexation rules."
          items={[
            { label: "Mode", value: isFutureCost ? "Future cost" : "Present value / purchasing power" },
            { label: amountLabel, value: formatIndianCurrency(liveInput.amount) },
            { label: "Assumed annual inflation rate", value: formatPercentage(liveInput.annualInflationRate) },
            { label: "Duration", value: `${liveInput.years} years` },
            { label: primaryLabel, value: formatIndianCurrency(primaryValue) },
            { label: secondaryLabel, value: formatIndianCurrency(secondaryValue) },
          ]}
        />
      </div>

      <section className="mt-10 border-t border-line pt-8" data-calculation-experience aria-labelledby="inflation-schedule-heading">
        <h2 id="inflation-schedule-heading" className="font-serif text-2xl font-semibold tracking-tight">Year-by-year schedule</h2>
        <p className="mt-3 text-muted-foreground">{isFutureCost ? "Each row shows the equivalent cost if the same amount were needed in that year instead of today." : "Each row shows what the future amount would be worth in today's purchasing power if received in that year instead."} Displayed currency is rounded; calculations retain precision.</p>
        <div className="mt-6">
          <DataTable caption={isFutureCost ? "Inflation future cost schedule" : "Inflation present value schedule"} rows={result.schedule} columns={scheduleColumns} initialRows={15} />
        </div>
      </section>
    </div>
  )
}
