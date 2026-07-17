export type HraCity = "metro" | "non-metro"

/**
 * One financial year's Section 10(13A) / Rule 2A parameters. Metro cities get
 * a higher percentage-of-salary limit than non-metro cities; the list of
 * which cities count as "metro" is itself part of the rule and has changed
 * across financial years (see ./README.md) — it is not a fixed constant.
 */
export type HraRuleSet = {
  readonly financialYear: string
  readonly assessmentYear: string
  readonly metroCities: readonly string[]
  readonly metroSalaryPercentage: number
  readonly nonMetroSalaryPercentage: number
  readonly rentMinusSalaryPercentage: number
}
