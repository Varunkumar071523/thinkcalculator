"use client"

import { useMemo, useState } from "react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateGST } from "./calculate-gst"
import { createGSTResultText, formatGSTCurrency, normaliseGSTDisplayZero } from "./gst-content"
import { getGSTRatePreset, GST_RATE_CONFIG } from "./gst-rate-config"
import { GST_LIMITS, isGSTCalculationMode, isGSTSupplyType, parseAndValidateGSTForm, parseGSTNumericText, type GSTFormValues } from "./gst-schema"
import type { GSTInput, GSTValidationErrors } from "./gst-types"
import { buildGSTCalculatorUrl, GST_DEFAULT_INPUT, parseGSTUrlState } from "./gst-url-state"

const modeOptions = [{ label: "Add GST to exclusive amount", value: "add" }, { label: "Remove GST from inclusive amount", value: "remove" }]
const supplyOptions = [{ label: "Intra-State — split CGST + SGST/UTGST", value: "intra-state" }, { label: "Inter-State — show IGST", value: "inter-state" }]

const AMOUNT_QUICK_AMOUNTS = [
  { label: "1K", value: "1000" },
  { label: "10K", value: "10000" },
  { label: "1L", value: "100000" },
  { label: "10L", value: "1000000" },
]

const toForm = (input: GSTInput): GSTFormValues => ({ amount: String(input.amount), gstRate: String(input.gstRate), calculationMode: input.calculationMode, supplyType: input.supplyType })

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Best-effort live view of the current form text, clamped into range and rounded to two decimal
 * places, so the result panel can update on every keystroke/slider move instead of waiting for a
 * valid, submitted form — calculateGST throws on anything validateGSTInput rejects, including more
 * than two decimal places, so live recalculation needs its own rounded-and-clamped view rather than
 * feeding raw typed text straight through. */
function toLiveInput(values: GSTFormValues): GSTInput {
  return {
    amount: round2(clampFinite(Number(values.amount), GST_DEFAULT_INPUT.amount, GST_LIMITS.amount.min, GST_LIMITS.amount.max)),
    gstRate: round2(clampFinite(Number(values.gstRate), GST_DEFAULT_INPUT.gstRate, GST_LIMITS.gstRate.min, GST_LIMITS.gstRate.max)),
    calculationMode: isGSTCalculationMode(values.calculationMode) ? values.calculationMode : "add",
    supplyType: isGSTSupplyType(values.supplyType) ? values.supplyType : "intra-state",
  }
}

export function GSTCalculator() {
  const [values, setValues] = useState<GSTFormValues>(() => toForm(GST_DEFAULT_INPUT))
  const [errors, setErrors] = useState<GSTValidationErrors>({})

  const markInteracted = useCalculatorUrlRestore((search) => {
    setValues(toForm(parseGSTUrlState(search)))
  })

  function update(field: keyof GSTFormValues, value: string) {
    markInteracted()
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    const validation = parseAndValidateGSTForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildGSTCalculatorUrl(validation.data))
  }

  function handleReset() {
    setValues(toForm(GST_DEFAULT_INPUT))
    setErrors({})
    window.history.replaceState(null, "", "/business/gst-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const result = useMemo(() => calculateGST(liveInput), [liveInput])
  useTrackCalculationCompleted("gst", "business", result)
  const enteredRate = parseGSTNumericText(values.gstRate)
  const activePreset = enteredRate === null ? undefined : getGSTRatePreset(enteredRate)
  const isAdd = liveInput.calculationMode === "add"
  const amountLabel = isAdd ? "GST-exclusive taxable amount" : "GST-inclusive amount"
  const amountHelp = isAdd ? "Enter the taxable value before GST is added." : "Enter the total amount that already includes GST."
  const primaryLabel = isAdd ? "Invoice / inclusive value" : "Taxable / exclusive value"
  const primaryValue = isAdd ? result.invoiceValue : result.taxableValue
  const secondaryLabel = isAdd ? "Taxable / exclusive value" : "Invoice / inclusive value"
  const secondaryValue = isAdd ? result.taxableValue : result.invoiceValue

  const shareUrl = buildGSTCalculatorUrl(liveInput, siteConfig.url)
  const resultText = createGSTResultText(liveInput, result)

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">GST details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <CalculatorSelectInput id="gst-mode" label="Calculation mode" description="Choose whether the entered amount excludes or already includes GST." value={values.calculationMode} onValueChange={(value) => update("calculationMode", value)} options={modeOptions} error={errors.calculationMode} required />

                <div>
                  <PairedNumberSliderInput
                    id="gst-amount"
                    label={amountLabel}
                    description={amountHelp}
                    prefix="₹"
                    min={GST_LIMITS.amount.min}
                    max={GST_LIMITS.amount.max}
                    step={0.01}
                    sliderMin={100}
                    sliderMax={1_000_000}
                    value={values.amount}
                    sliderValue={liveInput.amount}
                    onValueChange={(value) => update("amount", value)}
                    error={errors.amount}
                    required
                    accentClassName="accent-cat-business"
                  />
                  <div className="mt-2 flex gap-1.5">
                    {AMOUNT_QUICK_AMOUNTS.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => update("amount", preset.value)} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-cat-business hover:text-cat-business focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Quick rate presets</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Common GST rate arithmetic presets">
                    {GST_RATE_CONFIG.presets.map((preset) => <Button key={preset.value} type="button" size="sm" variant={activePreset?.value === preset.value ? "default" : "outline"} aria-pressed={activePreset?.value === preset.value} onClick={() => update("gstRate", String(preset.value))}>{preset.label}</Button>)}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">{activePreset ? `${activePreset.label} preset selected.` : "Custom rate entered."} Presets are arithmetic shortcuts, not classification advice.</p>
                </div>
                <PairedNumberSliderInput
                  id="gst-rate"
                  label="GST rate"
                  description="The rate input is the calculation value. Enter a custom rate if needed; up to two decimal places are accepted."
                  suffix="%"
                  min={GST_LIMITS.gstRate.min}
                  max={GST_LIMITS.gstRate.max}
                  step={0.01}
                  value={values.gstRate}
                  sliderValue={liveInput.gstRate}
                  onValueChange={(value) => update("gstRate", value)}
                  error={errors.gstRate}
                  required
                  accentClassName="accent-cat-business"
                />

                <CalculatorSelectInput id="gst-supply" label="Supply type for arithmetic" description="Select this yourself. The calculator does not infer place of supply from an address or location." value={values.supplyType} onValueChange={(value) => update("supplyType", value)} options={supplyOptions} error={errors.supplyType} required />
                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6"><strong>Rate and supply warning:</strong> actual applicability depends on current classification, notification, place-of-supply rules, and transaction facts. Verify official sources or consult a qualified professional.</div>
                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-business-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            <div className="border-b border-line pb-5 text-center">
              <p className="mb-1.5 text-[13px] text-muted-foreground">{primaryLabel}</p>
              <p className="font-mono text-[42px] leading-none font-bold text-cat-business">{formatGSTCurrency(primaryValue)}</p>
              <p className="mt-2 text-[12.5px] text-muted-foreground">{isAdd ? "adding" : "removing"} {formatPercentage(liveInput.gstRate)} GST {isAdd ? "to" : "from"} {formatGSTCurrency(liveInput.amount)}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">Total GST</p>
                <p className="font-mono text-lg font-semibold">{formatGSTCurrency(result.totalGSTAmount)}</p>
              </div>
              <div className="rounded-lg border border-line bg-card p-3.5">
                <p className="mb-1 text-xs text-muted-foreground">{secondaryLabel}</p>
                <p className="font-mono text-lg font-semibold">{formatGSTCurrency(secondaryValue)}</p>
              </div>
            </div>

            <div className="mt-5">
              <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="gst" category="business" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2" data-calculation-experience>
        <Card>
          <CardContent>
            <SimpleDonutChart title="Taxable value versus GST" items={[{ label: "Taxable value", value: result.taxableValue, formattedValue: formatGSTCurrency(result.taxableValue), colorClass: "bg-chart-1" }, { label: "Total GST", value: result.totalGSTAmount, formattedValue: formatGSTCurrency(result.totalGSTAmount), colorClass: "bg-chart-2" }]} />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">At 0%, GST is zero and the full circle represents the taxable value. Displayed amounts are rounded; calculation precision is retained.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Tax-head breakdown</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{liveInput.supplyType === "intra-state" ? "Intra-State arithmetic: total GST is divided equally between CGST and SGST/UTGST." : "Inter-State arithmetic: total GST is shown as IGST."}</p>
            <dl className="mt-4 divide-y">
              {([["CGST", result.cgstAmount], ["SGST/UTGST", result.sgstUtgstAmount], ["IGST", result.igstAmount]] as const).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2"><dt>{label}</dt><dd className="font-medium">{formatGSTCurrency(normaliseGSTDisplayZero(value))}</dd></div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Each tax head and total is rounded independently for display, so displayed halves can differ by one paise from the displayed total. No hidden round-off adjustment is applied. Use the rounding rules applicable to your invoice and accounting records.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
