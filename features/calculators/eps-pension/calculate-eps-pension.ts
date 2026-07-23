import {
  EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS,
  EPS_PENSION_BONUS_SERVICE_YEARS,
  EPS_PENSION_DIVISOR,
  EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR,
  EPS_PENSION_MINIMUM_MONTHLY_PENSION,
  EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS,
  EPS_PENSION_STANDARD_RETIREMENT_AGE,
  EPS_PENSION_WAGE_CEILING,
} from "./eps-pension-regulatory-config"
import { validateEpsPensionInput } from "./eps-pension-schema"
import type { EpsPensionInput, EpsPensionResult } from "./eps-pension-types"

/**
 * The reduction for taking a pension early is applied to the already-floored standard-age
 * pension, not to the raw formula figure. Paragraph 12(7) of the predecessor EPS 1995 (carried
 * over unchanged into EPS 2026 — see eps-pension-regulatory-config.ts) states the reduction in
 * terms of "the pension" a member draws at 58, and the ₹1,000 floor is itself a paragraph-12
 * guarantee on that pension — so a member entitled to the floor is entitled to 4%-per-year-early
 * off the floored amount, not off a smaller pre-floor formula figure. This is a documented
 * modelling choice (public sources describe the reduction rate precisely but not this
 * floor-vs-reduction ordering to the rupee) and it means an early, reduced pension can itself fall
 * below ₹1,000 — the floor guarantee applies to the standard-age pension, not to every reduced
 * variant of it.
 */
export function calculateEpsPension(input: EpsPensionInput): EpsPensionResult {
  const validation = validateEpsPensionInput(input)
  if (!validation.success) throw new RangeError("Invalid EPS pension input")

  const { averageMonthlySalary, yearsOfPensionableService, ageOption, earlyPensionAge } = validation.data

  const isEligible = yearsOfPensionableService >= EPS_PENSION_MIN_ELIGIBLE_SERVICE_YEARS
  const pensionableSalaryUsed = Math.min(averageMonthlySalary, EPS_PENSION_WAGE_CEILING)
  const isWageCeilingBinding = averageMonthlySalary > EPS_PENSION_WAGE_CEILING
  const bonusYearsApplied = yearsOfPensionableService >= EPS_PENSION_BONUS_SERVICE_THRESHOLD_YEARS
  const pensionableServiceUsed = yearsOfPensionableService + (bonusYearsApplied ? EPS_PENSION_BONUS_SERVICE_YEARS : 0)

  const formulaPension = (pensionableSalaryUsed * pensionableServiceUsed) / EPS_PENSION_DIVISOR
  const minimumPensionFloor = EPS_PENSION_MINIMUM_MONTHLY_PENSION
  const isFloorBinding = isEligible && formulaPension < minimumPensionFloor
  const standardMonthlyPension = isEligible ? Math.max(formulaPension, minimumPensionFloor) : 0

  const earlyPensionReductionPercent = EPS_PENSION_EARLY_PENSION_REDUCTION_PERCENT_PER_YEAR * (EPS_PENSION_STANDARD_RETIREMENT_AGE - earlyPensionAge)
  const earlyMonthlyPension = isEligible ? standardMonthlyPension * (1 - earlyPensionReductionPercent / 100) : 0

  const monthlyPension = ageOption === "early" ? earlyMonthlyPension : standardMonthlyPension

  const numericValues = [pensionableSalaryUsed, pensionableServiceUsed, formulaPension, standardMonthlyPension, earlyPensionReductionPercent, earlyMonthlyPension, monthlyPension]
  if (!numericValues.every(Number.isFinite)) throw new RangeError("EPS pension calculation produced a non-finite result")
  if (standardMonthlyPension < 0 || earlyMonthlyPension < 0 || monthlyPension < 0) throw new RangeError("EPS pension calculation produced a negative pension amount")

  return {
    ...validation.data,
    isEligible,
    pensionableSalaryUsed,
    isWageCeilingBinding,
    bonusYearsApplied,
    pensionableServiceUsed,
    formulaPension,
    minimumPensionFloor,
    isFloorBinding,
    standardMonthlyPension,
    earlyPensionReductionPercent,
    earlyMonthlyPension,
    monthlyPension,
  }
}
