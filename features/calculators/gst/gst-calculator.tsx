"use client"

import { useState, type FormEvent } from "react"
import { CalculationSummary } from "@/components/calculators/calculation-summary"
import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatorResultCard, CalculatorShell } from "@/features/calculators/core"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorResultItem } from "@/types/calculator"
import { calculateGST } from "./calculate-gst"
import { createGSTPrintDisclaimer, createGSTResultText, formatGSTCurrency, normaliseGSTDisplayZero } from "./gst-content"
import { getGSTRatePreset, GST_RATE_CONFIG } from "./gst-rate-config"
import { GST_LIMITS, parseAndValidateGSTForm, parseGSTNumericText, type GSTFormValues } from "./gst-schema"
import type { GSTInput, GSTResult, GSTValidationErrors } from "./gst-types"
import { buildGSTCalculatorUrl, GST_DEFAULT_INPUT, parseGSTUrlState, parseValidGSTUrlState } from "./gst-url-state"

const modeOptions = [{ label: "Add GST to exclusive amount", value: "add" }, { label: "Remove GST from inclusive amount", value: "remove" }]
const supplyOptions = [{ label: "Intra-State — split CGST + SGST/UTGST", value: "intra-state" }, { label: "Inter-State — show IGST", value: "inter-state" }]
const toForm = (input: GSTInput): GSTFormValues => ({ amount: String(input.amount), gstRate: String(input.gstRate), calculationMode: input.calculationMode, supplyType: input.supplyType })

export function createGSTResultItems(result: GSTResult): readonly CalculatorResultItem[] {
  const primary = result.calculationMode === "add" ? "invoice" : "taxable"
  return [
    { id: "taxable", label: "Taxable / exclusive value", value: normaliseGSTDisplayZero(result.taxableValue), displayType: "currency", isPrimary: primary === "taxable" },
    { id: "gst", label: "Total GST", value: normaliseGSTDisplayZero(result.totalGSTAmount), displayType: "currency" },
    { id: "invoice", label: "Invoice / inclusive value", value: normaliseGSTDisplayZero(result.invoiceValue), displayType: "currency", isPrimary: primary === "invoice" },
  ]
}

export function GSTCalculator() {
  const [values, setValues] = useState<GSTFormValues>(() => toForm(GST_DEFAULT_INPUT))
  const [errors, setErrors] = useState<GSTValidationErrors>({})
  const [calculation, setCalculation] = useState<{ input: GSTInput; result: GSTResult; date: string } | null>(null)
  const markInteracted = useCalculatorUrlRestore((search) => {
    const parsed = parseGSTUrlState(search)
    const shared = parseValidGSTUrlState(search)
    setValues(toForm(parsed))
    if (shared) setCalculation({ input: shared, result: calculateGST(shared), date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
  })

  function update(field: keyof GSTFormValues, value: string) {
    markInteracted()
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setCalculation(null)
  }
  function applyPreset(gstRate: number) {
    markInteracted()
    const nextValues = { ...values, gstRate: String(gstRate) }
    setValues(nextValues)
    const validation = parseAndValidateGSTForm(nextValues)
    if (!validation.success) { setErrors(validation.errors); setCalculation(null); return }
    setErrors({})
    const result = calculateGST(validation.data)
    setCalculation({ input: validation.data, result, date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    window.history.replaceState(null, "", buildGSTCalculatorUrl(validation.data))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = parseAndValidateGSTForm(values)
    if (!validation.success) { setErrors(validation.errors); setCalculation(null); return }
    const result = calculateGST(validation.data)
    setErrors({})
    setCalculation({ input: validation.data, result, date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date()) })
    window.history.replaceState(null, "", buildGSTCalculatorUrl(validation.data))
  }
  function reset() {
    setValues(toForm(GST_DEFAULT_INPUT)); setErrors({}); setCalculation(null)
    window.history.replaceState(null, "", "/business/gst-calculator")
  }

  const enteredRate = parseGSTNumericText(values.gstRate)
  const activePreset = enteredRate === null ? undefined : getGSTRatePreset(enteredRate)
  const amountLabel = values.calculationMode === "remove" ? "GST-inclusive amount" : "GST-exclusive taxable amount"
  const amountHelp = values.calculationMode === "remove" ? "Enter the total amount that already includes GST." : "Enter the taxable value before GST is added."
  const resultText = calculation ? createGSTResultText(calculation.input, calculation.result) : ""
  const shareUrl = calculation ? buildGSTCalculatorUrl(calculation.input, siteConfig.url) : ""

  return <>
    <div data-calculator-form><CalculatorShell title="Calculate GST" description="Add or remove an entered GST percentage and choose the tax-head arithmetic yourself."><form className="space-y-5" onSubmit={submit} noValidate>
      <CalculatorSelectInput id="gst-mode" label="Calculation mode" description="Choose whether the entered amount excludes or already includes GST." value={values.calculationMode} onValueChange={(value) => update("calculationMode", value)} options={modeOptions} error={errors.calculationMode} required />
      <CalculatorNumberInput id="gst-amount" label={amountLabel} description={amountHelp} prefix="₹" min={GST_LIMITS.amount.min} max={GST_LIMITS.amount.max} step={0.01} value={values.amount} onValueChange={(value) => update("amount", value)} error={errors.amount} required />
      <div>
        <p className="text-sm font-medium">Quick rate presets</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Common GST rate arithmetic presets">
          {GST_RATE_CONFIG.presets.map((preset) => <Button key={preset.value} type="button" size="sm" variant={activePreset?.value === preset.value ? "default" : "outline"} aria-pressed={activePreset?.value === preset.value} onClick={() => applyPreset(preset.value)}>{preset.label}</Button>)}
        </div>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">{activePreset ? `${activePreset.label} preset selected.` : "Custom rate entered."} Presets are arithmetic shortcuts, not classification advice.</p>
      </div>
      <CalculatorNumberInput id="gst-rate" label="GST rate" description="The rate input is the calculation value. Enter a custom rate if needed; up to two decimal places are accepted." suffix="%" min={GST_LIMITS.gstRate.min} max={GST_LIMITS.gstRate.max} step={0.01} value={values.gstRate} onValueChange={(value) => update("gstRate", value)} error={errors.gstRate} required />
      <CalculatorSelectInput id="gst-supply" label="Supply type for arithmetic" description="Select this yourself. The calculator does not infer place of supply from an address or location." value={values.supplyType} onValueChange={(value) => update("supplyType", value)} options={supplyOptions} error={errors.supplyType} required />
      <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6"><strong>Rate and supply warning:</strong> actual applicability depends on current classification, notification, place-of-supply rules, and transaction facts. Verify official sources or consult a qualified professional.</div>
      <div className="flex flex-col gap-3 sm:flex-row"><Button className="flex-1" size="lg" type="submit">Calculate GST</Button><Button className="flex-1" size="lg" variant="outline" type="button" onClick={reset}>Reset</Button></div>
    </form></CalculatorShell></div>
    <div className="space-y-6"><CalculatorResultCard title="GST result" items={calculation ? createGSTResultItems(calculation.result) : []} emptyTitle="Your GST result will appear here" emptyDescription="Choose the mode, enter the amount and rate, select supply arithmetic, then calculate." />
      {calculation ? <><CalculatorActions resultText={resultText} shareUrl={shareUrl} />
        <Card><CardContent><SimpleDonutChart title="Taxable value versus GST" items={[{ label: "Taxable value", value: calculation.result.taxableValue, formattedValue: formatGSTCurrency(calculation.result.taxableValue), colorClass: "bg-chart-1" }, { label: "Total GST", value: calculation.result.totalGSTAmount, formattedValue: formatGSTCurrency(calculation.result.totalGSTAmount), colorClass: "bg-chart-2" }]} /><p className="mt-4 text-sm leading-6 text-muted-foreground">At 0%, GST is zero and the full circle represents the taxable value. Displayed amounts are rounded; calculation precision is retained.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg">Tax-head breakdown</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{calculation.input.supplyType === "intra-state" ? "Intra-State arithmetic: total GST is divided equally between CGST and SGST/UTGST." : "Inter-State arithmetic: total GST is shown as IGST."}</p><dl className="mt-4 divide-y">{[["CGST", calculation.result.cgstAmount], ["SGST/UTGST", calculation.result.sgstUtgstAmount], ["IGST", calculation.result.igstAmount]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4 py-2"><dt>{label}</dt><dd className="font-medium">{formatGSTCurrency(Number(value))}</dd></div>)}</dl><p className="mt-4 text-sm leading-6 text-muted-foreground">Each tax head and total is rounded independently for display, so displayed halves can differ by one paise from the displayed total. No hidden round-off adjustment is applied. Use the rounding rules applicable to your invoice and accounting records.</p></CardContent></Card>
        <CalculationSummary title="ThinkCalculator GST Calculation" calculationDate={calculation.date} disclaimer={createGSTPrintDisclaimer()} items={[
          { label: `Entered ${calculation.input.calculationMode === "add" ? "exclusive" : "inclusive"} amount`, value: formatIndianCurrency(calculation.input.amount) },
          { label: "Entered GST rate", value: formatPercentage(calculation.input.gstRate) },
          { label: "Mode", value: calculation.input.calculationMode === "add" ? "Add GST" : "Remove GST" },
          { label: "Supply arithmetic", value: calculation.input.supplyType === "intra-state" ? "Intra-State — CGST + SGST/UTGST" : "Inter-State — IGST" },
          { label: "Taxable / exclusive value", value: formatGSTCurrency(calculation.result.taxableValue) }, { label: "Total GST", value: formatGSTCurrency(calculation.result.totalGSTAmount) }, { label: "Invoice / inclusive value", value: formatGSTCurrency(calculation.result.invoiceValue) },
          { label: "CGST", value: formatGSTCurrency(calculation.result.cgstAmount) }, { label: "SGST/UTGST", value: formatGSTCurrency(calculation.result.sgstUtgstAmount) }, { label: "IGST", value: formatGSTCurrency(calculation.result.igstAmount) },
        ]} />
      </> : null}
    </div>
  </>
}
