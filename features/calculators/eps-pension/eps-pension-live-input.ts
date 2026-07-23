import { EPS_PENSION_LIMITS, isEpsPensionAgeOption, type EpsPensionFormValues } from "./eps-pension-schema"
import type { EpsPensionInput } from "./eps-pension-types"
import { EPS_PENSION_DEFAULT_INPUT } from "./eps-pension-url-state"

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range on every keystroke/slider
 * move, so the result panel never hands calculateEpsPension a NaN/Infinity/out-of-range value
 * from an empty or mid-edit field — same guard as leave-encashment-live-input.ts's toLiveInput,
 * extracted into its own module from the start rather than left inline in the "use client"
 * component. yearsOfPensionableService and earlyPensionAge round to whole numbers because
 * calculateEpsPension's own validation rejects non-integers for both. */
export function toLiveInput(values: EpsPensionFormValues): EpsPensionInput {
  return {
    averageMonthlySalary: clampFinite(Number(values.averageMonthlySalary), EPS_PENSION_DEFAULT_INPUT.averageMonthlySalary, EPS_PENSION_LIMITS.averageMonthlySalary.min, EPS_PENSION_LIMITS.averageMonthlySalary.max),
    yearsOfPensionableService: Math.round(clampFinite(Number(values.yearsOfPensionableService), EPS_PENSION_DEFAULT_INPUT.yearsOfPensionableService, EPS_PENSION_LIMITS.yearsOfPensionableService.min, EPS_PENSION_LIMITS.yearsOfPensionableService.max)),
    ageOption: isEpsPensionAgeOption(values.ageOption) ? values.ageOption : EPS_PENSION_DEFAULT_INPUT.ageOption,
    earlyPensionAge: Math.round(clampFinite(Number(values.earlyPensionAge), EPS_PENSION_DEFAULT_INPUT.earlyPensionAge, EPS_PENSION_LIMITS.earlyPensionAge.min, EPS_PENSION_LIMITS.earlyPensionAge.max)),
  }
}
