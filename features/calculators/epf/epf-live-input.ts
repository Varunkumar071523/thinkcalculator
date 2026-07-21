import { EPF_LIMITS, type EPFFormValues } from "./epf-schema"
import type { EPFInput } from "./epf-types"
import { EPF_DEFAULT_INPUT } from "./epf-url-state"

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range on every keystroke/slider
 * move, so the result panel never hands calculateEPF a NaN/Infinity from an empty or mid-edit
 * field — the same recurring-bug-source guard every calculator in this batch applies (see
 * emi-calculator.tsx's toLiveInput). Also enforces the one cross-field ordering
 * validateEPFInput requires (retirement after current age) by nudging retirement age forward
 * rather than rejecting, matching retirement-calculator.tsx's approach.
 *
 * Pulled out of epf-calculator.tsx (a "use client" component) into its own module — rather than
 * left as an unexported function inside the component file, the pattern every earlier calculator
 * in this codebase used — specifically so the clamp behavior at slider extremes is directly
 * unit-testable (see __tests__/epf-live-input.test.ts) without mounting a component. */
export function toLiveInput(values: EPFFormValues): EPFInput {
  const currentAge = Math.round(clampFinite(Number(values.currentAge), EPF_DEFAULT_INPUT.currentAge, EPF_LIMITS.currentAge.min, EPF_LIMITS.currentAge.max))
  const rawRetirementAge = Math.round(clampFinite(Number(values.retirementAge), EPF_DEFAULT_INPUT.retirementAge, EPF_LIMITS.retirementAge.min, EPF_LIMITS.retirementAge.max))
  const retirementAge = Math.min(EPF_LIMITS.retirementAge.max, Math.max(rawRetirementAge, currentAge + 1))

  return {
    monthlyBasicSalary: clampFinite(Number(values.monthlyBasicSalary), EPF_DEFAULT_INPUT.monthlyBasicSalary, EPF_LIMITS.monthlyBasicSalary.min, EPF_LIMITS.monthlyBasicSalary.max),
    employeeContributionPercent: clampFinite(Number(values.employeeContributionPercent), EPF_DEFAULT_INPUT.employeeContributionPercent, EPF_LIMITS.employeeContributionPercent.min, EPF_LIMITS.employeeContributionPercent.max),
    employerContributionPercent: clampFinite(Number(values.employerContributionPercent), EPF_DEFAULT_INPUT.employerContributionPercent, EPF_LIMITS.employerContributionPercent.min, EPF_LIMITS.employerContributionPercent.max),
    currentAge,
    retirementAge,
    expectedAnnualInterestRate: clampFinite(Number(values.expectedAnnualInterestRate), EPF_DEFAULT_INPUT.expectedAnnualInterestRate, EPF_LIMITS.expectedAnnualInterestRate.min, EPF_LIMITS.expectedAnnualInterestRate.max),
  }
}
