import type { HraCity } from "./rules/types"

export type { HraCity } from "./rules/types"

/**
 * All figures are annual — this module has no period-by-period (month-by-
 * month) support, matching this sprint's scope. `da` is dearness allowance
 * that forms part of retirement benefits; salaried employees without such DA
 * should enter 0.
 */
export type HraCalcInput = {
  readonly basicSalary: number
  readonly da: number
  readonly hraReceived: number
  readonly rentPaid: number
  readonly city: HraCity
}

export type HraCalcField = keyof HraCalcInput
export type HraCalcValidationErrors = Partial<Record<HraCalcField, string>>

export type HraCalcValidationResult =
  | { readonly success: true; readonly data: HraCalcInput }
  | { readonly success: false; readonly errors: HraCalcValidationErrors }

/**
 * Which of the three Section 10(13A) / Rule 2A limits produced the smallest
 * (i.e. binding) value. On a tie, `actualHraReceived` wins over
 * `rentMinusTenPercentSalary`, which wins over `percentOfSalary` — see
 * `computeHraExemption` in engine.ts.
 */
export type HraConstraint = "actualHraReceived" | "rentMinusTenPercentSalary" | "percentOfSalary"

/**
 * Full, structured breakdown of a single HRA exemption calculation, intended
 * for the calculator UI to render each of the three constraints individually
 * alongside the binding one.
 */
export type HraCalcResult = {
  readonly financialYear: string
  readonly assessmentYear: string
  readonly input: HraCalcInput
  readonly salary: number
  readonly actualHraReceived: number
  readonly rentMinusTenPercentSalary: number
  readonly percentOfSalary: number
  readonly percentOfSalaryRate: number
  readonly bindingConstraint: HraConstraint
  readonly exemptHra: number
  readonly taxableHra: number
}
