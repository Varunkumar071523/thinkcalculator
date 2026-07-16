import type { TaxRuleSet } from "./types"

/**
 * Income tax rules for Financial Year 2025-26 (Assessment Year 2026-27),
 * as per the provisions announced in the Union Budget 2025 (Finance Act,
 * 2025), effective from 1 April 2025.
 *
 * See ./README.md for the source of every figure below and the
 * verification obligation before this ruleset is trusted for a new FY.
 */
export const FY2025_26_RULES: TaxRuleSet = {
  financialYear: "2025-26",
  assessmentYear: "2026-27",

  newRegime: {
    // New regime slabs, Sec 115BAC(1A) as amended by Finance Act, 2025
    slabs: [
      { upTo: 400_000, rate: 0 },
      { upTo: 800_000, rate: 0.05 },
      { upTo: 1_200_000, rate: 0.1 },
      { upTo: 1_600_000, rate: 0.15 },
      { upTo: 2_000_000, rate: 0.2 },
      { upTo: 2_400_000, rate: 0.25 },
      { upTo: null, rate: 0.3 },
    ],
    // Standard deduction for salary/pension income, new regime — Sec 16(ia)
    // read with Sec 115BAC(2), FY25-26 amount
    standardDeduction: 75_000,
    rebate87A: {
      // Sec 87A rebate threshold, new regime, FY25-26
      thresholdTaxableIncome: 1_200_000,
      // Sec 87A rebate cap, new regime, FY25-26 (equals slab tax at the
      // threshold: 5% of 4L + 10% of 4L = 60,000)
      maxRebateAmount: 60_000,
    },
    surchargeTiers: [
      // Surcharge thresholds/rates, Part I First Schedule, Finance Act 2025
      { thresholdTaxableIncome: 5_000_000, rate: 0.1 }, // > 50L
      { thresholdTaxableIncome: 10_000_000, rate: 0.15 }, // > 1Cr
      // New regime surcharge is capped at 25% — no 37% tier above 5Cr,
      // per the proviso limiting surcharge for income taxable u/s 115BAC(1A)
      { thresholdTaxableIncome: 20_000_000, rate: 0.25 }, // > 2Cr (capped)
    ],
  },

  oldRegime: {
    slabsByAgeBand: {
      // Old/existing regime slabs, individual below 60 — unchanged since
      // Finance Act 2023 (Part III, First Schedule)
      below60: [
        { upTo: 250_000, rate: 0 },
        { upTo: 500_000, rate: 0.05 },
        { upTo: 1_000_000, rate: 0.2 },
        { upTo: null, rate: 0.3 },
      ],
      // Senior citizen (60 to below 80) — higher nil band
      "60to80": [
        { upTo: 300_000, rate: 0 },
        { upTo: 500_000, rate: 0.05 },
        { upTo: 1_000_000, rate: 0.2 },
        { upTo: null, rate: 0.3 },
      ],
      // Super senior citizen (80 and above) — no 5% slab
      "80plus": [
        { upTo: 500_000, rate: 0 },
        { upTo: 1_000_000, rate: 0.2 },
        { upTo: null, rate: 0.3 },
      ],
    },
    // Standard deduction for salary/pension income, old regime — Sec 16(ia)
    standardDeduction: 50_000,
    rebate87A: {
      // Sec 87A rebate threshold, old regime — unchanged, original provision
      thresholdTaxableIncome: 500_000,
      // Sec 87A rebate cap, old regime (equals slab tax at the threshold:
      // 5% of 2.5L = 12,500)
      maxRebateAmount: 12_500,
    },
    surchargeTiers: [
      { thresholdTaxableIncome: 5_000_000, rate: 0.1 }, // > 50L
      { thresholdTaxableIncome: 10_000_000, rate: 0.15 }, // > 1Cr
      { thresholdTaxableIncome: 20_000_000, rate: 0.25 }, // > 2Cr
      // Old regime keeps the 37% top tier above 5Cr (not capped like new regime)
      { thresholdTaxableIncome: 50_000_000, rate: 0.37 }, // > 5Cr
    ],
    deductionCaps: {
      // Sec 80C (+80CCC/80CCD(1) combined in law; modelled here as a single
      // field) statutory ceiling — unchanged for many years
      section80C: 150_000,
      section80D: {
        // Sec 80D self/family health insurance cap, insured below 60
        below60: 25_000,
        // Sec 80D cap, insured 60 or above (senior citizen)
        age60OrAbove: 50_000,
      },
      // Sec 24(b) home loan interest cap for a self-occupied property.
      // Simplifying assumption: this engine always applies the
      // self-occupied cap; a let-out property has no statutory cap, which
      // this model does not distinguish (see README limitations).
      homeLoanInterestSection24b: 200_000,
    },
  },

  // Health and Education Cess, levied via Sec 2 of the annual Finance Act —
  // unchanged rate for several years
  cessRate: 0.04,
}
