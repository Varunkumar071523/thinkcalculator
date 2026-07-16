import { DataTable, type DataTableColumn } from "@/components/calculators/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { formatIndianCurrency, formatPercentage } from "@/lib/formatters"
import type { SlabBreakdownRow, TaxCalculationResult } from "@/lib/tax/types"
import type { CalculatorResultItem } from "@/types/calculator"
import { INCOME_TAX_RULE_SET } from "./income-tax-regulatory-config"

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

export function IncomeTaxResultSummary({ result }: { readonly result: TaxCalculationResult | null }) {
  return (
    <CalculatorResultCard
      title="Tax liability"
      items={result ? createIncomeTaxResultItems(result) : []}
      emptyTitle="Your tax estimate will appear here"
      emptyDescription="Choose a regime, enter your income and details, then select Calculate."
    />
  )
}

export function IncomeTaxSlabBreakdownSection({ result }: { readonly result: TaxCalculationResult }) {
  return (
    <section className="col-span-full mt-4" data-calculation-experience aria-labelledby="slab-breakdown-heading">
      <h2 id="slab-breakdown-heading" className="text-2xl font-semibold tracking-tight">Slab-by-slab breakdown</h2>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Each row shows the portion of your taxable income that falls in that slab and the tax charged on it. Rows sum to the tax before rebate, surcharge, and cess.</p>
      <div className="mt-6">
        <DataTable caption="Income tax slab-by-slab breakdown" rows={[...result.slabBreakdown]} columns={slabColumns} initialRows={result.slabBreakdown.length} />
      </div>
    </section>
  )
}
