import { formatIndianCurrency, formatIndianNumber, formatIsoDate } from "@/lib/formatters"
import { siteConfig } from "@/lib/site-config"
import type { CalculatorFAQ, CalculatorWorkedExample, RelatedCalculator } from "@/types/calculator"
import { calculateCapitalGains } from "./calculate-capital-gains"
import {
  CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION,
  CAPITAL_GAINS_LTCG_TAX_RATE,
  CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
  CAPITAL_GAINS_STCG_TAX_RATE,
} from "./capital-gains-regulatory-config"
import type { CapitalGainsInput, CapitalGainsResult } from "./capital-gains-types"
import { CAPITAL_GAINS_DEFAULT_INPUT } from "./capital-gains-url-state"

export const capitalGainsFAQs: readonly CalculatorFAQ[] = [
  {
    question: "How does the calculator decide whether a lot is short-term or long-term?",
    answer: "By comparing the sale date to exactly 12 months after that lot's purchase date. A sale on or before that date is short-term (section 111A); a sale any later is long-term (section 112A). This applies only to listed equity shares and equity-oriented mutual fund units on which securities transaction tax (STT) has been paid, which this calculator assumes.",
  },
  {
    question: "Is the ₹1,25,000 LTCG exemption available separately for every sale I make?",
    answer: "No. It is a single amount pooled across ALL your section 112A long-term equity gains in a financial year, not per sale or per calculator run. This calculator applies it against the LTCG total from the one sale event you enter here; if you have other equity LTCG transactions in the same year, you need to consider the exemption across all of them together, not use it again for each.",
  },
  {
    question: "What is the pre-31-January-2018 grandfathering rule, and why does it only affect some lots?",
    answer: "For equity shares or mutual fund units acquired before 31 January 2018, the cost of acquisition used for the LTCG computation is the higher of (a) the actual cost, and (b) the lower of the fair market value (FMV) as on 31 January 2018 and the actual sale price. It exists because section 112A itself only started taxing these gains from Assessment Year 2019-20 onward, so gains that had already accrued by 31 January 2018 are protected from tax. A lot bought on or after that date never needs an FMV — its actual cost is used directly.",
  },
  {
    question: "Where do I find the fair market value as on 31 January 2018 for an old holding?",
    answer: "For listed shares, it is the highest quoted price on a recognised stock exchange on 31 January 2018 (or the nearest preceding trading day if the exchange was closed that day). For mutual fund units not listed on an exchange, it is the net asset value (NAV) on that date. Several depositories, registrars, and fund houses publish this figure on request for older holdings.",
  },
  {
    question: "Does FIFO matching matter if my broker's contract note or demat statement uses a different method?",
    answer: "Yes — for computing capital gains under the Income-tax Act, shares and mutual fund units are matched oldest-first (first-in-first-out) by acquisition date, regardless of which lot a broker's own internal accounting or a demat account's default display happens to show as sold. This calculator applies FIFO for that reason, sorting your entered lots by purchase date before matching them against the units sold.",
  },
  {
    question: "Does this calculator account for Section 87A rebate, surcharge, or cess?",
    answer: "No. It computes only the flat section 111A (20%) and section 112A (12.5%) tax on the gains you enter. Section 87A rebate generally cannot be claimed against STCG under 111A or LTCG under 112A under either tax regime (with a narrow new-regime carve-out this calculator does not model), and applicable surcharge and health-and-education cess on the resulting tax are also not computed here. Use the Income Tax Calculator for your overall slab-rate liability, and treat this figure as the capital-gains tax component only.",
  },
  {
    question: "What if I have a loss on some of the matched lots?",
    answer: "A loss on one lot is netted against gains on other lots within the same classification — all matched STCG lots are pooled together, and all matched LTCG lots are pooled together, before tax is applied to each pool. If a pool's net result is a loss, this calculator shows zero tax for that pool rather than a negative figure; it does not model carrying that loss forward to a future year or setting it off against gains in the other pool or against other income heads, which follow separate statutory rules.",
  },
  {
    question: "Does it matter whether I select listed equity shares or equity-oriented mutual fund units?",
    answer: "Not for the tax computation — sections 111A and 112A tax both instrument types identically, at the same rates, thresholds, and holding-period rule, provided STT has been paid. The asset type selector only changes labeling and context in this calculator; it does not change any number in the result.",
  },
  {
    question: "Does this cover debt mutual funds, real estate, gold, or unlisted shares?",
    answer: "No. Debt funds, real estate, gold, and unlisted or non-STT-paid securities follow different capital-gains provisions with different rates, holding-period thresholds, and (for debt funds since April 2023) different indexation treatment entirely. This calculator is scoped only to STT-paid listed equity shares and equity-oriented mutual fund units under sections 111A and 112A.",
  },
]

export const capitalGainsRelatedCalculators: readonly RelatedCalculator[] = [
  {
    slug: "income-tax-calculator",
    title: "Income Tax Calculator",
    description: "Estimate overall income tax liability under the old and new regimes for salary and other slab-rate income — capital gains are computed separately here.",
    href: "/finance/income-tax-calculator",
    category: "Finance",
  },
  {
    slug: "sip-calculator",
    title: "SIP Calculator",
    description: "Project the future value of an ongoing equity mutual fund SIP before you plan a redemption and its capital-gains tax.",
    href: "/finance/sip-calculator",
    category: "Finance",
  },
  {
    slug: "cagr-calculator",
    title: "CAGR Calculator",
    description: "Work out the annualised growth rate of an investment from its purchase and sale value, alongside its capital-gains tax here.",
    href: "/finance/cagr-calculator",
    category: "Finance",
  },
]

export const capitalGainsWorkedExampleInput: CapitalGainsInput = CAPITAL_GAINS_DEFAULT_INPUT
export const capitalGainsWorkedExampleResult: CapitalGainsResult = calculateCapitalGains(capitalGainsWorkedExampleInput)

export const capitalGainsWorkedExample: CalculatorWorkedExample = {
  title: "Three lots, one grandfathered, a mixed STCG/LTCG sale that partially uses up the exemption",
  description: "An investor sells 2,150 listed equity shares at ₹200 each on 15 June 2026, held across three purchase lots. FIFO matches the sale against the two oldest lots in full and part of the newest lot. The oldest lot was bought before 31 January 2018, so its cost basis is grandfathered. The two older lots are long-term; the newest (partially matched) lot is short-term. Pooled LTCG of ₹1,90,000 partially exceeds the ₹1,25,000 exemption.",
  inputs: [
    { label: "Asset type", value: "Listed equity shares" },
    { label: "Lot 1 — purchased", value: `${formatIsoDate(capitalGainsWorkedExampleInput.lots[0].purchaseDate)}, ${formatIndianNumber(capitalGainsWorkedExampleInput.lots[0].units)} units @ ${formatIndianCurrency(capitalGainsWorkedExampleInput.lots[0].costPerUnit)}` },
    { label: "Lot 1 — FMV as on 31 Jan 2018", value: formatIndianCurrency(capitalGainsWorkedExampleInput.lots[0].fairMarketValuePerUnitOn31Jan2018 ?? 0) },
    { label: "Lot 2 — purchased", value: `${formatIsoDate(capitalGainsWorkedExampleInput.lots[1].purchaseDate)}, ${formatIndianNumber(capitalGainsWorkedExampleInput.lots[1].units)} units @ ${formatIndianCurrency(capitalGainsWorkedExampleInput.lots[1].costPerUnit)}` },
    { label: "Lot 3 — purchased", value: `${formatIsoDate(capitalGainsWorkedExampleInput.lots[2].purchaseDate)}, ${formatIndianNumber(capitalGainsWorkedExampleInput.lots[2].units)} units @ ${formatIndianCurrency(capitalGainsWorkedExampleInput.lots[2].costPerUnit)}` },
    { label: "Sale date", value: formatIsoDate(capitalGainsWorkedExampleInput.saleDate) },
    { label: "Units sold", value: `${formatIndianNumber(capitalGainsWorkedExampleInput.unitsSold)} units` },
    { label: "Sale price per unit", value: formatIndianCurrency(capitalGainsWorkedExampleInput.salePricePerUnit) },
  ],
  results: [
    { label: "Lot 1 — matched units (grandfathered cost ₹100/unit)", value: `${formatIndianNumber(capitalGainsWorkedExampleResult.matchedLots[0].matchedUnits)} units, LTCG gain ${formatIndianCurrency(capitalGainsWorkedExampleResult.matchedLots[0].gain)}` },
    { label: "Lot 2 — matched units", value: `${formatIndianNumber(capitalGainsWorkedExampleResult.matchedLots[1].matchedUnits)} units, LTCG gain ${formatIndianCurrency(capitalGainsWorkedExampleResult.matchedLots[1].gain)}` },
    { label: "Lot 3 — matched units (partial, short-term)", value: `${formatIndianNumber(capitalGainsWorkedExampleResult.matchedLots[2].matchedUnits)} of ${formatIndianNumber(capitalGainsWorkedExampleInput.lots[2].units)} units, STCG gain ${formatIndianCurrency(capitalGainsWorkedExampleResult.matchedLots[2].gain)}` },
    { label: "Pooled LTCG", value: formatIndianCurrency(capitalGainsWorkedExampleResult.totalLTCG) },
    { label: "LTCG exemption used", value: formatIndianCurrency(capitalGainsWorkedExampleResult.ltcgExemptionUsed) },
    { label: "Taxable LTCG (after exemption)", value: formatIndianCurrency(capitalGainsWorkedExampleResult.ltcgTaxableAfterExemption) },
    { label: "LTCG tax (12.5%)", value: formatIndianCurrency(capitalGainsWorkedExampleResult.ltcgTax) },
    { label: "Total STCG", value: formatIndianCurrency(capitalGainsWorkedExampleResult.totalSTCG) },
    { label: "STCG tax (20%)", value: formatIndianCurrency(capitalGainsWorkedExampleResult.stcgTax) },
    { label: "Total tax", value: formatIndianCurrency(capitalGainsWorkedExampleResult.totalTax) },
    { label: "Net proceeds after tax", value: formatIndianCurrency(capitalGainsWorkedExampleResult.netProceedsAfterTax) },
  ],
}

export function createCapitalGainsResultText(input: CapitalGainsInput, result: CapitalGainsResult): string {
  return [
    "ThinkCalculator Capital Gains (Equity) Tax Estimate",
    "",
    `Asset type: ${input.assetType === "equity-share" ? "Listed equity shares" : "Equity-oriented mutual fund units"}`,
    `Sale date: ${formatIsoDate(input.saleDate)}, ${formatIndianNumber(input.unitsSold)} units @ ${formatIndianCurrency(input.salePricePerUnit)}`,
    `Total sale value: ${formatIndianCurrency(result.totalSaleValue)}`,
    "",
    `Total STCG: ${formatIndianCurrency(result.totalSTCG)}`,
    `STCG tax (20%): ${formatIndianCurrency(result.stcgTax)}`,
    `Total LTCG: ${formatIndianCurrency(result.totalLTCG)}`,
    `LTCG exemption used: ${formatIndianCurrency(result.ltcgExemptionUsed)}`,
    `Taxable LTCG: ${formatIndianCurrency(result.ltcgTaxableAfterExemption)}`,
    `LTCG tax (12.5%): ${formatIndianCurrency(result.ltcgTax)}`,
    `Total tax: ${formatIndianCurrency(result.totalTax)}`,
    `Net proceeds after tax: ${formatIndianCurrency(result.netProceedsAfterTax)}`,
    "",
    `Regulatory sources reviewed ${CAPITAL_GAINS_REGULATORY_REVIEW_DATE}. This is an educational estimate under sections 111A/112A, not tax advice.`,
    "Calculator:",
    `${siteConfig.url}/finance/capital-gains-calculator`,
  ].join("\n")
}

export function createCapitalGainsPrintDisclaimer(): string {
  return `Official sources reviewed ${CAPITAL_GAINS_REGULATORY_REVIEW_DATE}. This estimate applies FIFO lot matching, the pre-31-January-2018 grandfathering rule where applicable, and the current section 111A (${formatIndianNumber(CAPITAL_GAINS_STCG_TAX_RATE * 100)}%) and section 112A (${formatIndianNumber(CAPITAL_GAINS_LTCG_TAX_RATE * 100)}%, ₹${CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION.toLocaleString("en-IN")} exemption) rates to the figures entered. It is not personalised tax advice, does not compute surcharge, cess, or Section 87A rebate, and does not verify STT payment, broker records, or other transactions affecting your annual LTCG exemption.`
}
