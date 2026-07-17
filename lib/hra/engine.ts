import { getHraRuleSet } from "./rules"
import type { HraRuleSet } from "./rules/types"
import type { HraCalcInput, HraCalcResult, HraConstraint } from "./types"
import { validateHraCalcInput } from "./validation"

/**
 * Section 10(13A) / Rule 2A exempt HRA is the least of three limits. On a
 * tie, `actualHraReceived` wins over `rentMinusTenPercentSalary`, which wins
 * over `percentOfSalary`, matching this array's order — an arbitrary but
 * deterministic and stable choice so the same input always reports the same
 * binding constraint.
 */
function resolveBindingConstraint(
  actualHraReceived: number,
  rentMinusTenPercentSalary: number,
  percentOfSalary: number,
): { readonly id: HraConstraint; readonly value: number } {
  const constraints: readonly { readonly id: HraConstraint; readonly value: number }[] = [
    { id: "actualHraReceived", value: actualHraReceived },
    { id: "rentMinusTenPercentSalary", value: rentMinusTenPercentSalary },
    { id: "percentOfSalary", value: percentOfSalary },
  ]
  return constraints.reduce((min, current) => (current.value < min.value ? current : min))
}

export function computeHraExemption(input: HraCalcInput, financialYear: string): HraCalcResult {
  const ruleSet: HraRuleSet = getHraRuleSet(financialYear)
  const validation = validateHraCalcInput(input)
  if (!validation.success) throw new RangeError("Invalid HRA calculation input")
  const data = validation.data

  const salary = data.basicSalary + data.da
  const percentOfSalaryRate = data.city === "metro" ? ruleSet.metroSalaryPercentage : ruleSet.nonMetroSalaryPercentage

  const actualHraReceived = data.hraReceived
  // Floored at 0 rather than allowed to go negative: when rent paid is at or
  // below 10% of salary, this limit contributes nothing to the exemption
  // rather than reducing it below zero.
  const rentMinusTenPercentSalary = Math.max(0, data.rentPaid - salary * ruleSet.rentMinusSalaryPercentage)
  const percentOfSalary = salary * percentOfSalaryRate

  const binding = resolveBindingConstraint(actualHraReceived, rentMinusTenPercentSalary, percentOfSalary)
  const exemptHra = binding.value
  // exemptHra can never exceed actualHraReceived (it is one of the three
  // candidates the minimum is taken over), so this is always >= 0.
  const taxableHra = data.hraReceived - exemptHra

  return {
    financialYear: ruleSet.financialYear,
    assessmentYear: ruleSet.assessmentYear,
    input: data,
    salary,
    actualHraReceived,
    rentMinusTenPercentSalary,
    percentOfSalary,
    percentOfSalaryRate,
    bindingConstraint: binding.id,
    exemptHra,
    taxableHra,
  }
}
