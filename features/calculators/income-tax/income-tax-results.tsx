import { CollapsibleSection } from "@/components/calculators/collapsible-section"
import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { SlabBreakdownRow, TaxCalculationResult } from "@/lib/tax/types"
import type { CalculatorResultItem } from "@/types/calculator"
import { INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"

/** Kept as a pure, independently-tested mapping (see income-tax-integration.test.ts) even though
 * the calculator UI itself now renders the regime-comparison panel and IncomeTaxBreakdownCard's dl
 * instead of a CalculatorResultCard item list. */
export function createIncomeTaxResultItems(result: TaxCalculationResult): readonly CalculatorResultItem[] {
  return [
    { id: "total-tax", label: "Total tax liability", value: result.totalTaxLiability, displayType: "currency", isPrimary: true },
    { id: "taxable-income", label: "Taxable income", value: result.taxableIncome, displayType: "currency" },
    { id: "total-deductions", label: "Total deductions", value: result.totalDeductions, displayType: "currency" },
    { id: "tax-before-rebate", label: "Tax before rebate", value: result.taxBeforeRebate, displayType: "currency" },
    { id: "rebate-87a", label: "Section 87A rebate", value: result.rebate87A.rebateAmount, displayType: "currency" },
    { id: "surcharge", label: "Surcharge", value: result.surcharge.surcharge, displayType: "currency" },
    { id: "cess", label: "Health & Education Cess (4%)", value: result.cess, displayType: "currency" },
  ]
}

function describeSurchargeTier(result: TaxCalculationResult): string {
  if (result.surcharge.rate === 0) return "No surcharge applies — taxable income is ₹50,00,000 or below."
  const tiers = result.regime === "old" ? INCOME_TAX_RULE_SET.oldRegime.surchargeTiers : INCOME_TAX_RULE_SET.newRegime.surchargeTiers
  const tier = tiers.find((candidate) => candidate.rate === result.surcharge.rate)
  const thresholdText = tier ? `above ${formatIndianCurrency(tier.thresholdTaxableIncome)} taxable income` : "at this income level"
  return `${formatPercentage(result.surcharge.rate * 100)} surcharge tier (${thresholdText})${result.surcharge.marginalReliefApplied ? ", reduced by marginal relief" : ""}.`
}

function describeRebate(result: TaxCalculationResult): string {
  if (result.rebate87A.rebateAmount === 0) return "No Section 87A rebate applies at this taxable income."
  const zeroedTax = result.rebate87A.taxAfterRebate === 0
  const marginal = result.rebate87A.marginalReliefApplied ? " with marginal relief" : ""
  return zeroedTax
    ? `A ${formatIndianCurrency(result.rebate87A.rebateAmount)} rebate${marginal} brought tax down to zero.`
    : `A ${formatIndianCurrency(result.rebate87A.rebateAmount)} rebate${marginal} was applied, leaving ${formatIndianCurrency(result.rebate87A.taxAfterRebate)} payable before surcharge and cess.`
}

const slabColumns: readonly DataTableColumn<SlabBreakdownRow>[] = [
  { header: "Income slab", cell: (row) => (row.to === null ? `Above ${formatIndianCurrency(row.from)}` : `${formatIndianCurrency(row.from)} – ${formatIndianCurrency(row.to)}`) },
  { header: "Rate", cell: (row) => formatPercentage(row.rate * 100) },
  { header: "Taxable amount in slab", cell: (row) => formatIndianCurrency(row.taxableAmountInSlab) },
  { header: "Tax at this slab", cell: (row) => formatIndianCurrency(row.taxAtThisSlab) },
]

export function IncomeTaxBreakdownCard({ result }: { readonly result: TaxCalculationResult }) {
  return (
    <Card data-testid="income-tax-breakdown-card">
      <CardHeader><CardTitle className="text-lg">{result.regime === "old" ? "Old Regime" : "New Regime"} breakdown</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Taxable income</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.taxableIncome)}</dd></div>
          <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Total deductions</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.totalDeductions)}</dd></div>
          <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Tax before rebate</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.taxBeforeRebate)}</dd></div>
          <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Section 87A rebate</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.rebate87A.rebateAmount)}</dd></div>
          <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Surcharge</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.surcharge.surcharge)}</dd></div>
          <div className="rounded-lg border bg-muted/30 p-4"><dt className="text-sm text-muted-foreground">Health & Education Cess (4%)</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.cess)}</dd></div>
          <div className="rounded-lg border bg-muted/30 p-4 sm:col-span-2"><dt className="text-sm text-muted-foreground">Total tax liability</dt><dd className="mt-1 break-words text-xl font-semibold">{formatIndianCurrency(result.totalTaxLiability)}</dd></div>
        </dl>
      </CardContent>
    </Card>
  )
}

export function IncomeTaxRebateSurchargeCard({ result }: { readonly result: TaxCalculationResult }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Rebate, surcharge & cess detail</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>Standard deduction of {formatIndianCurrency(result.standardDeduction)} plus {formatIndianCurrency(result.totalOtherDeductions)} in other deductions reduced gross income of {formatIndianCurrency(result.grossIncome)} to a taxable income of {formatIndianCurrency(result.taxableIncome)}.</p>
        <p>{describeRebate(result)}</p>
        <p>{describeSurchargeTier(result)}</p>
        <p>Cess of 4% on tax plus surcharge ({formatIndianCurrency(result.taxPlusSurcharge)}) adds {formatIndianCurrency(result.cess)}, for a total tax liability of {formatIndianCurrency(result.totalTaxLiability)}.</p>
      </CardContent>
    </Card>
  )
}

export function IncomeTaxSlabBreakdownSection({ result }: { readonly result: TaxCalculationResult }) {
  return (
    <div className="mt-8" data-calculation-experience>
      <CollapsibleSection title="Slab-by-slab breakdown" description="Each row shows the portion of your taxable income that falls in that slab and the tax charged on it. Rows sum to the tax before rebate, surcharge, and cess.">
        <DataTable caption="Income tax slab-by-slab breakdown" rows={[...result.slabBreakdown]} columns={slabColumns} initialRows={result.slabBreakdown.length} />
      </CollapsibleSection>
    </div>
  )
}
