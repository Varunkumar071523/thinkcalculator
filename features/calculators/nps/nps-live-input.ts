import { NPS_LIMITS, type NPSFormValues } from "./nps-schema"
import type { NPSInput } from "./nps-types"
import { NPS_DEFAULT_INPUT } from "./nps-url-state"

function clampFinite(value: number, fallback: number, min: number, max: number): number {
  const base = Number.isFinite(value) ? value : fallback
  return Math.min(Math.max(base, min), max)
}

/** Best-effort live view of the current form text, clamped into range on every keystroke/slider
 * move, so the result panel never hands calculateNPS a NaN/Infinity from an empty or mid-edit
 * field (the same recurring-bug-source guard every calculator in this batch applies), and never an
 * equity+corporateDebt combination that exceeds 100% (nudging corporate debt down to fit, the same
 * "nudge forward instead of reject" approach retirement-calculator.tsx uses for its age ordering).
 *
 * Government securities allocation is never a free input (see nps-schema.ts's cross-field-rule
 * doc comment and nps-types.ts's NPSResult.govtSecuritiesAllocationPercent) — it is always
 * `100 - equityAllocationPercent - corporateDebtAllocationPercent`, computed downstream by
 * calculateNPS. That means the three allocation shares summing to exactly 100% is a structural
 * guarantee of this input shape, not a runtime invariant that could be violated: there is no state
 * in which `toLiveInput` could return an equity/debt/govt split that fails to sum to 100, because
 * govt is never stored as a field to begin with. The clamp below (`corporateDebtAllocationPercent`
 * capped at `100 - equityAllocationPercent`) exists only to stop the two *stored* shares
 * (equity + debt) from themselves exceeding 100% — which would otherwise make the derived govt
 * share negative — not to "rebalance" three independent sliders back to 100.
 *
 * Pulled out of nps-calculator.tsx (a "use client" component) into its own module — rather than
 * left as an unexported function inside the component file, the pattern every earlier calculator
 * in this codebase used — specifically so the clamp behavior at slider extremes, including this
 * allocation-sum guarantee, is directly unit-testable (see __tests__/nps-live-input.test.ts)
 * without mounting a component. */
export function toLiveInput(values: NPSFormValues): NPSInput {
  const currentAge = Math.round(clampFinite(Number(values.currentAge), NPS_DEFAULT_INPUT.currentAge, NPS_LIMITS.currentAge.min, NPS_LIMITS.currentAge.max))
  const rawRetirementAge = Math.round(clampFinite(Number(values.retirementAge), NPS_DEFAULT_INPUT.retirementAge, NPS_LIMITS.retirementAge.min, NPS_LIMITS.retirementAge.max))
  const retirementAge = Math.min(NPS_LIMITS.retirementAge.max, Math.max(rawRetirementAge, currentAge + 1))

  const equityAllocationPercent = clampFinite(Number(values.equityAllocationPercent), NPS_DEFAULT_INPUT.equityAllocationPercent, NPS_LIMITS.equityAllocationPercent.min, NPS_LIMITS.equityAllocationPercent.max)
  const rawCorporateDebt = clampFinite(Number(values.corporateDebtAllocationPercent), NPS_DEFAULT_INPUT.corporateDebtAllocationPercent, NPS_LIMITS.corporateDebtAllocationPercent.min, NPS_LIMITS.corporateDebtAllocationPercent.max)
  const corporateDebtAllocationPercent = Math.min(rawCorporateDebt, 100 - equityAllocationPercent)

  return {
    monthlyContribution: clampFinite(Number(values.monthlyContribution), NPS_DEFAULT_INPUT.monthlyContribution, NPS_LIMITS.monthlyContribution.min, NPS_LIMITS.monthlyContribution.max),
    currentAge,
    retirementAge,
    equityAllocationPercent,
    corporateDebtAllocationPercent,
    equityExpectedReturn: clampFinite(Number(values.equityExpectedReturn), NPS_DEFAULT_INPUT.equityExpectedReturn, NPS_LIMITS.equityExpectedReturn.min, NPS_LIMITS.equityExpectedReturn.max),
    corporateDebtExpectedReturn: clampFinite(Number(values.corporateDebtExpectedReturn), NPS_DEFAULT_INPUT.corporateDebtExpectedReturn, NPS_LIMITS.corporateDebtExpectedReturn.min, NPS_LIMITS.corporateDebtExpectedReturn.max),
    govtSecuritiesExpectedReturn: clampFinite(Number(values.govtSecuritiesExpectedReturn), NPS_DEFAULT_INPUT.govtSecuritiesExpectedReturn, NPS_LIMITS.govtSecuritiesExpectedReturn.min, NPS_LIMITS.govtSecuritiesExpectedReturn.max),
  }
}
