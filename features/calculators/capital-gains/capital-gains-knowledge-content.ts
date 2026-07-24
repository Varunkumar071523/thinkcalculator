import type { CalculatorKnowledgeContent } from "@/types/calculator-content"
import {
  CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE,
  CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION,
  CAPITAL_GAINS_LTCG_TAX_RATE,
  CAPITAL_GAINS_OFFICIAL_SOURCES,
  CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
  CAPITAL_GAINS_STCG_TAX_RATE,
} from "./capital-gains-regulatory-config"

function formatPercent(rate: number): string {
  return `${(rate * 100).toString()}%`
}

export const capitalGainsKnowledgeContent = {
  title: "Understand capital gains tax on equity shares and mutual funds",
  description: "Learn how sections 111A and 112A tax short-term and long-term gains on listed equity shares and equity-oriented mutual funds, how FIFO lot matching and the pre-2018 grandfathering rule work, and the questions this calculator does not decide.",
  sections: [
    {
      id: "capital-gains-meaning",
      title: "What capital gains means for equity investments",
      type: "overview",
      content: [{ type: "paragraph", text: "A capital gain is the difference between what you receive for selling listed equity shares or equity-oriented mutual fund units and what you originally paid for them (their cost of acquisition). Indian tax law splits this gain into short-term (STCG) or long-term (LTCG) depending on how long the specific units were held, and taxes each category differently — a flat rate for STCG under section 111A, and a flat rate after a pooled annual exemption for LTCG under section 112A." }],
    },
    {
      id: "capital-gains-current-framework",
      title: "Current statutory context",
      type: "overview",
      content: [
        { type: "paragraph", text: `The Finance (No. 2) Act, 2024 raised the section 111A STCG rate to ${formatPercent(CAPITAL_GAINS_STCG_TAX_RATE)} and the section 112A LTCG rate to ${formatPercent(CAPITAL_GAINS_LTCG_TAX_RATE)} (without indexation), and raised the section 112A annual exemption to ₹${CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION.toLocaleString("en-IN")}, effective for transfers on or after 23 July 2024. Sources were reviewed on ${CAPITAL_GAINS_REGULATORY_REVIEW_DATE} and confirm these figures unchanged through FY 2026-27.` },
        { type: "callout", variant: "important", title: "STT payment is a precondition", text: "Sections 111A and 112A apply only where securities transaction tax (STT) has been paid on the transaction (subject to a small set of notified exceptions for certain off-market and overseas transfers). This calculator assumes STT has been paid and does not verify it." },
      ],
    },
    {
      id: "capital-gains-inputs",
      title: "What to enter",
      type: "input-guide",
      content: [{ type: "list", style: "numbered", items: [
        "Choose listed equity shares or equity-oriented mutual fund units — this only changes labeling; the tax treatment is identical.",
        "Add one row per purchase lot: the purchase date, the number of units, and the cost per unit.",
        `For any lot purchased before ${CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE}, also enter the fair market value per unit as on that date — the calculator only asks for this when a lot's date requires it.`,
        "Enter the single sale event: the sale date, total units sold, and sale price per unit.",
        "The calculator matches your sale against lots oldest-first automatically — you do not need to specify which lot is being sold.",
      ] }],
    },
    {
      id: "capital-gains-method",
      title: "How FIFO matching and gain classification work",
      type: "how-it-works",
      content: [
        { type: "paragraph", text: "The units sold are matched against your purchase lots in first-in-first-out (FIFO) order by purchase date, regardless of the order you entered them in. The oldest lot is consumed first; once it is fully used up, the next-oldest lot is consumed, and so on until the total units sold is reached." },
        { type: "list", style: "numbered", items: [
          "Sort all lots by purchase date, oldest first.",
          "Subtract matched units from each lot in turn until the units sold is fully accounted for; a lot may be matched only partially if it is the last one needed.",
          "Classify each matched lot independently: a sale on or before the date exactly 12 months after that lot's purchase date is short-term (111A); any later sale is long-term (112A).",
          "Apply grandfathering to a matched lot's cost basis if it qualifies (see below), then compute that lot's gain as matched units × (sale price − effective cost per unit).",
        ] },
      ],
    },
    {
      id: "capital-gains-grandfathering",
      title: "How the pre-2018 grandfathering rule changes cost basis",
      type: "interpretation",
      content: [
        { type: "paragraph", text: `For a lot acquired before ${CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE}, the cost of acquisition used for its LTCG computation is not simply what you paid. It is the higher of (a) the actual cost, and (b) the lower of (i) the fair market value (FMV) as on ${CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE}, and (ii) the sale price. This can only raise the cost basis relative to the actual cost — it can reduce or eliminate the taxable gain that had already accrued before section 112A began taxing equity LTCG, but it can never turn a real gain into a deductible loss.` },
        { type: "table", caption: "Effect of the grandfathering formula on a single unit's cost basis (actual cost ₹50, sale price ₹200)", headers: ["FMV as on 31 Jan 2018", "Lower of FMV or sale price", "Cost basis used (higher of actual cost or that figure)"], rows: [["₹120", "₹120", "₹120"], ["₹30", "₹30", "₹50 (actual cost, since it is higher)"], ["₹300", "₹200 (capped at sale price)", "₹200 (gain reduced to zero, not negative)"]] },
      ],
    },
    {
      id: "capital-gains-exemption-pooling",
      title: "How the pooled LTCG exemption works across lots",
      type: "interpretation",
      content: [
        { type: "paragraph", text: `The ₹${CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION.toLocaleString("en-IN")} exemption under section 112A applies once against the total of all your LTCG-classified gains in a financial year — not separately for each lot, and not separately for each sale. This calculator sums every matched lot's gain that is classified as long-term into a single pooled figure, applies the exemption against that pool, and taxes only the remainder at ${formatPercent(CAPITAL_GAINS_LTCG_TAX_RATE)}. Short-term gains are pooled the same way but receive no exemption at all — the full section 111A rate applies to the entire pooled STCG total.` },
        { type: "callout", variant: "warning", title: "The exemption is a whole-year figure, not a per-run figure", text: "If you have other equity LTCG transactions elsewhere in the same financial year, this calculator cannot see them. It applies the full ₹1,25,000 exemption against only the sale you enter here, which will overstate the exemption actually available to you if you have used part of it already." },
      ],
    },
    {
      id: "capital-gains-benefits",
      title: "What this estimate is useful for",
      type: "benefits",
      content: [{ type: "list", style: "bullet", items: [
        "See exactly which of your purchase lots the sale draws from under FIFO, before you place the trade.",
        "Understand how much of an older holding's gain is protected by grandfathering.",
        "Check whether a sale's pooled LTCG will exceed the annual exemption, and by how much.",
        "Compare a scenario with different mixes of short-term and long-term lots side by side.",
      ] }],
    },
    {
      id: "capital-gains-comparison",
      title: "Capital gains compared with income tax on salary and other income",
      type: "comparison",
      content: [{ type: "table", caption: "Educational comparison of this calculator and the Income Tax Calculator — general characteristics, not tax advice; verify current rules and your own facts before relying on any row.", headers: ["Aspect", "Capital Gains Calculator (this tool)", "Income Tax Calculator"], rows: [
        ["Applicable provision", "Sections 111A and 112A, Income-tax Act, 1961 — special rates for STT-paid equity", "Slab rates under the old or new regime, sections 115BAC and the general charging provisions"],
        ["Rate structure", "Flat rate regardless of total income: 20% STCG, 12.5% LTCG above the exemption", "Progressive slab rates that rise with total taxable income"],
        ["Exemption/deduction structure", "One pooled annual exemption of ₹1,25,000 against LTCG only; no exemption for STCG", "Basic exemption slab, standard deduction, and (old regime) a range of itemised deductions"],
        ["What determines the rate", "Holding period of each matched lot (12-month threshold) and whether STT was paid", "Total taxable income across all heads and the regime chosen"],
        ["Section 87A rebate", "Not available against 111A/112A gains under either regime (a narrow new-regime carve-out is not modelled here)", "Available against slab-rate tax up to the regime's rebate threshold"],
        ["Where the two connect", "This calculator's total tax is a separate figure that adds to (not replaces) your slab-rate liability", "Its own FAQ states capital gains under 111A/112/112A are out of scope and computed separately — exactly what this calculator fills in"],
      ] }],
    },
    {
      id: "capital-gains-mistakes",
      title: "Common mistakes",
      type: "common-mistakes",
      content: [{ type: "list", style: "bullet", items: [
        "Assuming the ₹1,25,000 exemption resets for every sale, instead of once per financial year across all equity LTCG transactions.",
        "Entering a fair market value for a lot purchased on or after 31 January 2018, where grandfathering does not apply at all.",
        "Manually picking which lot to treat as 'sold' instead of letting FIFO (oldest lot first) decide, which is what the law requires regardless of broker statements.",
        "Treating the calculator's total tax as your complete tax bill, when surcharge, cess, and your slab-rate liability on other income are not included.",
        "Forgetting that a purchase date must be on or before the sale date for every lot — a future-dated lot cannot be matched against a past sale.",
      ] }],
    },
    {
      id: "capital-gains-practical-checks",
      title: "Practical checks before relying on a result",
      type: "practical-tips",
      content: [{ type: "list", style: "bullet", items: [
        "Confirm STT was actually paid on the transaction — off-market transfers and certain overseas trades may not qualify for these sections at all.",
        "Get the exact fair market value as on 31 January 2018 from your broker, registrar, or fund house for any pre-2018 holding, rather than estimating it.",
        "Track your cumulative LTCG across every equity sale in the financial year, not just the one entered here, before assuming the exemption is fully available.",
        "Recheck the current STCG/LTCG rates and exemption against an official source close to your filing date, since a future Budget can change them.",
      ] }],
    },
    {
      id: "capital-gains-limitations",
      title: "Cases outside this calculator",
      type: "limitations",
      content: [{ type: "paragraph", text: "This calculator does not compute surcharge, health-and-education cess, or Section 87A rebate interaction; does not model capital loss carry-forward or set-off against other income; does not verify STT payment or broker records; does not track LTCG used elsewhere in the same financial year against the pooled exemption; and does not cover debt mutual funds, real estate, gold, unlisted shares, or any other capital-gains asset class, all of which follow different provisions." }],
    },
    {
      id: "capital-gains-disclaimer",
      title: "Educational and tax limitation",
      type: "limitations",
      content: [{ type: "callout", variant: "warning", title: "Estimate, not tax advice", text: "This calculator explains FIFO lot matching, grandfathering, and sections 111A/112A tax using figures you enter. It is not personalised tax, investment, or legal advice, and does not establish your actual holdings, transaction history, or final tax liability. Verify the current statutory figures and your specific facts with a qualified professional or official source before relying on this result." }],
    },
  ],
  relatedLinks: [
    { title: "Income Tax Calculator", description: "Estimate overall income tax liability under the old and new regimes for salary and other slab-rate income.", href: "/finance/income-tax-calculator" },
    { title: "SIP Calculator", description: "Project the future value of an ongoing equity mutual fund SIP.", href: "/finance/sip-calculator" },
  ],
  references: CAPITAL_GAINS_OFFICIAL_SOURCES.map((source) => ({
    title: `${source.title} — reviewed ${source.checkedOn}`,
    organization: source.issuingAuthority,
    url: source.url,
  })),
} as const satisfies CalculatorKnowledgeContent
