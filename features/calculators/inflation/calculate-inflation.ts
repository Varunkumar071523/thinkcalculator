import { validateInflationInput } from "./inflation-schema"
import type { InflationFutureCostResult, InflationInput, InflationPresentValueResult, InflationResult, InflationScheduleRow } from "./inflation-types"

/**
 * Explicit modelling decisions:
 *
 * (a) Compounding convention: the entered annual rate compounds ANNUALLY, i.e. factor = (1 + rate/100) ** years.
 *     This matches how other calculators in the repo treat an annual percentage input as a once-per-year
 *     compounding rate: CAGR derives its rate from `growthMultiple ** (1 / years)` (the inverse of this same
 *     annual-compounding relationship), and PPF compounds its annual rate once per year in a year-by-year loop.
 *     Inflation is treated the same way for consistency across the app.
 *
 * (b) Deflation: a negative annualInflationRate is a fully valid, correctly-behaving input — it is never
 *     clamped to zero. The factor (1 + rate/100) simply falls below 1 for negative rates, which naturally
 *     makes future cost fall below the current amount, and makes present value rise above the future amount
 *     (a fixed future sum is worth MORE in today's purchasing power when prices are falling). No special-case
 *     branching is needed; the same formula handles inflation and deflation symmetrically. The -10% floor
 *     (see inflation-schema.ts) only exists to keep the compounding base comfortably positive, not to
 *     suppress genuine deflation scenarios.
 *
 * (c) Zero inflation: (1 + 0) ** years === 1 exactly in floating point, so future cost equals the current
 *     amount and present value equals the future amount with no distortion. This also falls out of the
 *     formula itself and needs no separate branch.
 *
 * (d) Rounding/precision: every internal value (factors, schedule rows, results) keeps full floating-point
 *     precision. Rounding only happens in the presentation layer via formatIndianCurrency/formatPercentage,
 *     consistent with every other calculator in the repo.
 */

function inflationFactor(annualInflationRate: number, years: number): number {
  return Math.pow(1 + annualInflationRate / 100, years)
}

function generateFutureCostSchedule(currentAmount: number, annualInflationRate: number, years: number): readonly InflationScheduleRow[] {
  const rows: InflationScheduleRow[] = []
  for (let year = 1; year <= years; year++) {
    const cumulativeFactor = inflationFactor(annualInflationRate, year)
    rows.push({ year, cumulativeFactor, equivalentValue: currentAmount * cumulativeFactor })
  }
  return rows
}

function generatePresentValueSchedule(futureAmount: number, annualInflationRate: number, years: number): readonly InflationScheduleRow[] {
  const rows: InflationScheduleRow[] = []
  for (let year = 1; year <= years; year++) {
    const cumulativeFactor = 1 / inflationFactor(annualInflationRate, year)
    rows.push({ year, cumulativeFactor, equivalentValue: futureAmount * cumulativeFactor })
  }
  return rows
}

export function calculateInflationFutureCost(input: InflationInput): InflationFutureCostResult {
  if (!validateInflationInput(input).success) throw new RangeError("Invalid Inflation input")
  const currentAmount = input.amount
  const inflationMultiple = inflationFactor(input.annualInflationRate, input.years)
  const futureValue = currentAmount * inflationMultiple
  const totalInflationImpact = futureValue - currentAmount
  const schedule = generateFutureCostSchedule(currentAmount, input.annualInflationRate, input.years)
  const result: InflationFutureCostResult = { mode:"futureCost", currentAmount, futureValue, totalInflationImpact, inflationMultiple, schedule }
  if (!Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)) throw new RangeError("Inflation calculation produced a non-finite result")
  return result
}

export function calculateInflationPresentValue(input: InflationInput): InflationPresentValueResult {
  if (!validateInflationInput(input).success) throw new RangeError("Invalid Inflation input")
  const futureAmount = input.amount
  const discountMultiple = 1 / inflationFactor(input.annualInflationRate, input.years)
  const presentValue = futureAmount * discountMultiple
  const purchasingPowerChange = futureAmount - presentValue
  const purchasingPowerChangePercentage = (purchasingPowerChange / futureAmount) * 100
  const schedule = generatePresentValueSchedule(futureAmount, input.annualInflationRate, input.years)
  const result: InflationPresentValueResult = { mode:"presentValue", futureAmount, presentValue, purchasingPowerChange, purchasingPowerChangePercentage, discountMultiple, schedule }
  if (!Object.values(result).filter((value) => typeof value === "number").every(Number.isFinite)) throw new RangeError("Inflation calculation produced a non-finite result")
  return result
}

export function calculateInflation(input: InflationInput): InflationResult {
  return input.mode === "futureCost" ? calculateInflationFutureCost(input) : calculateInflationPresentValue(input)
}
