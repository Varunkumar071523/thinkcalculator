"use client"

import { useMemo, useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { CalculatorActions } from "@/components/calculators/calculator-actions"
import { CalculatorDateInput } from "@/components/calculators/calculator-date-input"
import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { PairedNumberSliderInput } from "@/components/calculators/paired-number-slider-input"
import { SimpleDonutChart } from "@/components/calculators/simple-donut-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalculatorUrlRestore } from "@/features/calculators/core/use-calculator-url-restore"
import { useTrackCalculationCompleted } from "@/features/calculators/core/use-track-calculation"
import { formatIndianCurrency, formatIndianNumber, formatIsoDate } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import { calculateCapitalGains } from "./calculate-capital-gains"
import { createCapitalGainsResultText } from "./capital-gains-content"
import { isGrandfatheringApplicable } from "./capital-gains-grandfathering"
import { toLiveInput } from "./capital-gains-live-input"
import { CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION } from "./capital-gains-regulatory-config"
import {
  CAPITAL_GAINS_ASSET_TYPE_OPTIONS,
  CAPITAL_GAINS_LIMITS,
  CAPITAL_GAINS_MAX_LOTS,
  parseAndValidateCapitalGainsForm,
  type CapitalGainsFormValues,
  type CapitalGainsLotFormValues,
} from "./capital-gains-schema"
import type { CapitalGainsInput, CapitalGainsValidationErrors } from "./capital-gains-types"
import { CAPITAL_GAINS_DEFAULT_INPUT, buildCapitalGainsCalculatorUrl, parseCapitalGainsUrlState } from "./capital-gains-url-state"

const ASSET_TYPE_SELECT_OPTIONS = CAPITAL_GAINS_ASSET_TYPE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))

function toLotFormValues(lot: CapitalGainsInput["lots"][number]): CapitalGainsLotFormValues {
  return {
    id: lot.id,
    purchaseDate: lot.purchaseDate,
    units: String(lot.units),
    costPerUnit: String(lot.costPerUnit),
    fairMarketValuePerUnitOn31Jan2018: lot.fairMarketValuePerUnitOn31Jan2018 === null ? "" : String(lot.fairMarketValuePerUnitOn31Jan2018),
  }
}

function toFormValues(input: CapitalGainsInput): CapitalGainsFormValues {
  return {
    assetType: input.assetType,
    lots: input.lots.map(toLotFormValues),
    saleDate: input.saleDate,
    unitsSold: String(input.unitsSold),
    salePricePerUnit: String(input.salePricePerUnit),
  }
}

const EMPTY_NEW_LOT: Omit<CapitalGainsLotFormValues, "id"> = {
  purchaseDate: "",
  units: "",
  costPerUnit: "",
  fairMarketValuePerUnitOn31Jan2018: "",
}

export function CapitalGainsCalculator() {
  const [values, setValues] = useState<CapitalGainsFormValues>(() => toFormValues(CAPITAL_GAINS_DEFAULT_INPUT))
  const [errors, setErrors] = useState<CapitalGainsValidationErrors>({})
  const nextLotNumber = useRef(values.lots.length + 1)

  const markInteracted = useCalculatorUrlRestore((search) => {
    const restored = parseCapitalGainsUrlState(search)
    setValues(toFormValues(restored))
    nextLotNumber.current = restored.lots.length + 1
  })

  function commit(nextValues: CapitalGainsFormValues) {
    setValues(nextValues)
    const validation = parseAndValidateCapitalGainsForm(nextValues)
    setErrors(validation.success ? {} : validation.errors)
    if (validation.success) window.history.replaceState(null, "", buildCapitalGainsCalculatorUrl(validation.data))
  }

  function updateAssetType(value: string) {
    markInteracted()
    commit({ ...values, assetType: value })
  }

  function updateSaleField(field: "saleDate" | "unitsSold" | "salePricePerUnit", value: string) {
    markInteracted()
    commit({ ...values, [field]: value })
  }

  function updateLotField(lotId: string, field: keyof Omit<CapitalGainsLotFormValues, "id">, value: string) {
    markInteracted()
    commit({ ...values, lots: values.lots.map((lot) => (lot.id === lotId ? { ...lot, [field]: value } : lot)) })
  }

  function addLot() {
    markInteracted()
    const id = `lot-${nextLotNumber.current++}`
    commit({ ...values, lots: [...values.lots, { id, ...EMPTY_NEW_LOT }] })
  }

  function removeLot(lotId: string) {
    markInteracted()
    commit({ ...values, lots: values.lots.filter((lot) => lot.id !== lotId) })
  }

  function handleReset() {
    setValues(toFormValues(CAPITAL_GAINS_DEFAULT_INPUT))
    nextLotNumber.current = CAPITAL_GAINS_DEFAULT_INPUT.lots.length + 1
    setErrors({})
    window.history.replaceState(null, "", "/finance/capital-gains-calculator")
  }

  const liveInput = useMemo(() => toLiveInput(values), [values])
  const hasNoLots = liveInput.lots.length === 0
  const result = useMemo(() => (hasNoLots ? null : calculateCapitalGains(liveInput)), [liveInput, hasNoLots])
  useTrackCalculationCompleted("capital-gains", "taxes", result)

  const shareUrl = buildCapitalGainsCalculatorUrl(liveInput.lots.length > 0 ? liveInput : CAPITAL_GAINS_DEFAULT_INPUT, siteConfig.url)
  const resultText = result ? createCapitalGainsResultText(liveInput, result) : ""

  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div data-calculator-form>
          <Card>
            <CardHeader><CardTitle className="text-base">Capital gains details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-5">
                <CalculatorSelectInput
                  id="asset-type"
                  label="Asset type"
                  description="Tax treatment is identical for both — this only changes labeling."
                  value={values.assetType}
                  onValueChange={updateAssetType}
                  options={ASSET_TYPE_SELECT_OPTIONS}
                  error={errors.assetType}
                  required
                />

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Purchase lots</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addLot} disabled={values.lots.length >= CAPITAL_GAINS_MAX_LOTS}>
                      <Plus aria-hidden="true" /> Add lot
                    </Button>
                  </div>
                  {errors.lots ? <p className="mb-2 text-sm text-destructive" role="alert">{errors.lots}</p> : null}
                  <div className="space-y-4">
                    {values.lots.map((lot, index) => {
                      const lotError = errors.lotErrors?.[lot.id]
                      const requiresFmv = isGrandfatheringApplicable(lot.purchaseDate || "9999-12-31")
                      return (
                        <div key={lot.id} className="rounded-lg border border-line p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Lot {index + 1}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLot(lot.id)} aria-label={`Remove lot ${index + 1}`}>
                              <Trash2 aria-hidden="true" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <CalculatorDateInput
                              id={`lot-${lot.id}-purchase-date`}
                              label="Purchase date"
                              value={lot.purchaseDate}
                              onValueChange={(value) => updateLotField(lot.id, "purchaseDate", value)}
                              error={lotError?.purchaseDate}
                              required
                            />
                            <CalculatorNumberInput
                              id={`lot-${lot.id}-units`}
                              label="Units"
                              value={lot.units}
                              onValueChange={(value) => updateLotField(lot.id, "units", value)}
                              min={CAPITAL_GAINS_LIMITS.units.min}
                              max={CAPITAL_GAINS_LIMITS.units.max}
                              step={1}
                              error={lotError?.units}
                              required
                            />
                            <CalculatorNumberInput
                              id={`lot-${lot.id}-cost-per-unit`}
                              label="Cost per unit"
                              prefix="₹"
                              value={lot.costPerUnit}
                              onValueChange={(value) => updateLotField(lot.id, "costPerUnit", value)}
                              min={CAPITAL_GAINS_LIMITS.costPerUnit.min}
                              max={CAPITAL_GAINS_LIMITS.costPerUnit.max}
                              step={0.01}
                              error={lotError?.costPerUnit}
                              required
                            />
                            {requiresFmv ? (
                              <CalculatorNumberInput
                                id={`lot-${lot.id}-fmv`}
                                label="FMV per unit, 31 Jan 2018"
                                description="Required — this lot was acquired before the grandfathering cutoff."
                                prefix="₹"
                                value={lot.fairMarketValuePerUnitOn31Jan2018}
                                onValueChange={(value) => updateLotField(lot.id, "fairMarketValuePerUnitOn31Jan2018", value)}
                                min={CAPITAL_GAINS_LIMITS.fairMarketValuePerUnit.min}
                                max={CAPITAL_GAINS_LIMITS.fairMarketValuePerUnit.max}
                                step={0.01}
                                error={lotError?.fairMarketValuePerUnitOn31Jan2018}
                                required
                              />
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                    {values.lots.length === 0 ? <p className="text-sm text-muted-foreground">Add at least one purchase lot to see a result.</p> : null}
                  </div>
                </div>

                <div className="border-t border-line pt-5">
                  <h3 className="mb-3 text-sm font-medium">Sale event</h3>
                  <div className="space-y-5">
                    <CalculatorDateInput
                      id="sale-date"
                      label="Sale date"
                      value={values.saleDate}
                      onValueChange={(value) => updateSaleField("saleDate", value)}
                      error={errors.saleDate}
                      required
                    />
                    <PairedNumberSliderInput
                      id="units-sold"
                      label="Units sold"
                      value={values.unitsSold}
                      sliderValue={liveInput.unitsSold}
                      onValueChange={(value) => updateSaleField("unitsSold", value)}
                      min={CAPITAL_GAINS_LIMITS.unitsSold.min}
                      max={CAPITAL_GAINS_LIMITS.unitsSold.max}
                      step={1}
                      sliderMin={0}
                      sliderMax={5_000}
                      error={errors.unitsSold}
                      required
                      accentClassName="accent-cat-tax"
                    />
                    <PairedNumberSliderInput
                      id="sale-price-per-unit"
                      label="Sale price per unit"
                      prefix="₹"
                      value={values.salePricePerUnit}
                      sliderValue={liveInput.salePricePerUnit}
                      onValueChange={(value) => updateSaleField("salePricePerUnit", value)}
                      min={CAPITAL_GAINS_LIMITS.salePricePerUnit.min}
                      max={CAPITAL_GAINS_LIMITS.salePricePerUnit.max}
                      step={0.01}
                      sliderMin={0}
                      sliderMax={5_000}
                      error={errors.salePricePerUnit}
                      required
                      accentClassName="accent-cat-tax"
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  <strong>Narrow scope:</strong> this covers only STT-paid listed equity shares and equity-oriented mutual funds under sections 111A/112A. It does not compute surcharge, cess, Section 87A rebate, or LTCG already used elsewhere in the financial year against the pooled exemption.
                </div>
                <Button className="w-full" size="lg" variant="outline" type="button" onClick={handleReset}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-b from-cat-tax-soft to-card to-55%" data-testid="calculator-result-card" data-print-summary aria-live="polite">
          <CardContent>
            {result ? (
              <>
                <div className="border-b border-line pb-5 text-center">
                  <p className="mb-1.5 text-[13px] text-muted-foreground">Total capital gains tax</p>
                  <p className="font-mono text-[42px] leading-none font-bold text-cat-tax">{formatIndianCurrency(result.totalTax)}</p>
                  <p className="mt-2 text-[12.5px] text-muted-foreground">on {formatIndianCurrency(result.totalSaleValue)} sale proceeds ({formatIndianNumber(result.unitsSold)} units @ {formatIndianCurrency(result.salePricePerUnit)})</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-line bg-card p-3.5">
                    <p className="mb-1 text-xs text-muted-foreground">Total STCG (20%)</p>
                    <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalSTCG)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Tax: {formatIndianCurrency(result.stcgTax)}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-card p-3.5">
                    <p className="mb-1 text-xs text-muted-foreground">Total LTCG (12.5%)</p>
                    <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.totalLTCG)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Tax: {formatIndianCurrency(result.ltcgTax)}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-card p-3.5">
                    <p className="mb-1 text-xs text-muted-foreground">LTCG exemption used</p>
                    <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.ltcgExemptionUsed)}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-card p-3.5">
                    <p className="mb-1 text-xs text-muted-foreground">Net proceeds after tax</p>
                    <p className="font-mono text-lg font-semibold">{formatIndianCurrency(result.netProceedsAfterTax)}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <CalculatorActions resultText={resultText} shareUrl={shareUrl} calculatorType="capital-gains" category="taxes" />
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">Add at least one purchase lot to see a result.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {result ? (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2" data-calculation-experience>
            <Card>
              <CardContent>
                <SimpleDonutChart
                  title="LTCG: exempt vs taxable"
                  items={[
                    { label: "Exempt", value: result.ltcgExemptionUsed, formattedValue: formatIndianCurrency(result.ltcgExemptionUsed), colorClass: "bg-money", ringClass: "stroke-money" },
                    { label: "Taxable", value: result.ltcgTaxableAfterExemption, formattedValue: formatIndianCurrency(result.ltcgTaxableAfterExemption), colorClass: "bg-gold", ringClass: "stroke-gold" },
                  ]}
                />
                <p className="mt-4 text-sm leading-6 text-muted-foreground">The ₹{CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION.toLocaleString("en-IN")} annual exemption applies once to your pooled long-term gains; short-term gains (shown separately above) receive no exemption.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">FIFO matching summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Units sold are matched against lots oldest-first:</p>
                <dl className="mt-4 divide-y">
                  {result.matchedLots.map((lot) => (
                    <div key={lot.lotId} className="flex items-center justify-between gap-4 py-2">
                      <dt>{formatIsoDate(lot.purchaseDate)} · {formatIndianNumber(lot.matchedUnits)} units · <span className={lot.classification === "ltcg" ? "text-money" : "text-gold"}>{lot.classification === "ltcg" ? "LTCG" : "STCG"}</span>{lot.isGrandfathered ? " · grandfathered" : ""}</dt>
                      <dd className="font-mono">{formatIndianCurrency(lot.gain)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6" data-calculation-experience>
            <CollapsibleSection title="Per-lot breakdown" description="Every intermediate figure used to compute each matched lot's gain.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Purchase date</th>
                      <th className="py-2 pr-4">Matched units</th>
                      <th className="py-2 pr-4">Classification</th>
                      <th className="py-2 pr-4">Cost/unit used</th>
                      <th className="py-2 pr-4">Sale value</th>
                      <th className="py-2 pr-4">Gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matchedLots.map((lot) => (
                      <tr key={lot.lotId} className="border-b border-line/50">
                        <td className="py-2 pr-4">{formatIsoDate(lot.purchaseDate)}</td>
                        <td className="py-2 pr-4 font-mono">{formatIndianNumber(lot.matchedUnits)}</td>
                        <td className="py-2 pr-4">{lot.classification === "ltcg" ? "LTCG" : "STCG"}{lot.isGrandfathered ? " (grandfathered)" : ""}</td>
                        <td className="py-2 pr-4 font-mono">{formatIndianCurrency(lot.effectiveCostPerUnit)}{lot.isGrandfathered ? <span className="ml-1 text-xs text-muted-foreground">(was {formatIndianCurrency(lot.originalCostPerUnit)})</span> : null}</td>
                        <td className="py-2 pr-4 font-mono">{formatIndianCurrency(lot.saleValue)}</td>
                        <td className="py-2 pr-4 font-mono">{formatIndianCurrency(lot.gain)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          </div>
        </>
      ) : null}
    </div>
  )
}
