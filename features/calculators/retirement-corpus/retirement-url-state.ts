import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseRetirementNumericText, validateRetirementInput } from "./retirement-schema"
import type { RetirementInput } from "./retirement-types"

// Pre- and post-retirement return default to the SAME value (see calculate-retirement.ts decision 2):
// the simple single-rate case costs a user nothing extra, while the post-retirement field remains
// independently editable for a more conservative post-retirement allocation.
export const RETIREMENT_DEFAULT_INPUT: RetirementInput = {
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 85,
  currentSavings: 500_000,
  monthlyContribution: 15_000,
  expectedReturnPreRetirement: 10,
  expectedReturnPostRetirement: 10,
  desiredMonthlyWithdrawal: 50_000,
  inflationRate: 6,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
function read(search: SearchInput, key: string) { const value = search instanceof URLSearchParams ? search.get(key) ?? undefined : search[key]; return Array.isArray(value) ? value[0] : value }

export function parseValidRetirementUrlState(search: SearchInput): RetirementInput | null {
  const age = read(search, "age"), retireAge = read(search, "retireAge"), life = read(search, "life"), savings = read(search, "savings"), contribution = read(search, "contribution"), preReturn = read(search, "preReturn"), postReturn = read(search, "postReturn"), withdrawal = read(search, "withdrawal"), inflation = read(search, "inflation")
  if ([age, retireAge, life, savings, contribution, preReturn, postReturn, withdrawal, inflation].some((value) => value === undefined)) return null
  const parsed = [
    parseRetirementNumericText(age!),
    parseRetirementNumericText(retireAge!),
    parseRetirementNumericText(life!),
    parseRetirementNumericText(savings!),
    parseRetirementNumericText(contribution!),
    parseRetirementNumericText(preReturn!),
    parseRetirementNumericText(postReturn!),
    parseRetirementNumericText(withdrawal!),
    parseRetirementNumericText(inflation!, true),
  ]
  if (parsed.some((value) => value === null)) return null
  const candidate: RetirementInput = {
    currentAge: parsed[0]!, retirementAge: parsed[1]!, lifeExpectancy: parsed[2]!,
    currentSavings: parsed[3]!, monthlyContribution: parsed[4]!,
    expectedReturnPreRetirement: parsed[5]!, expectedReturnPostRetirement: parsed[6]!,
    desiredMonthlyWithdrawal: parsed[7]!, inflationRate: parsed[8]!,
  }
  const validation = validateRetirementInput(candidate)
  return validation.success ? validation.data : null
}

export function parseRetirementUrlState(search: SearchInput) { return parseValidRetirementUrlState(search) ?? RETIREMENT_DEFAULT_INPUT }

export function serializeRetirementUrlState(input: RetirementInput) {
  if (!validateRetirementInput(input).success) throw new RangeError("Invalid Retirement Corpus URL state")
  return new URLSearchParams({
    age: String(input.currentAge),
    retireAge: String(input.retirementAge),
    life: String(input.lifeExpectancy),
    savings: String(input.currentSavings),
    contribution: String(input.monthlyContribution),
    preReturn: String(input.expectedReturnPreRetirement),
    postReturn: String(input.expectedReturnPostRetirement),
    withdrawal: String(input.desiredMonthlyWithdrawal),
    inflation: String(input.inflationRate),
  })
}

export function buildRetirementCalculatorUrl(input: RetirementInput, origin?: string) { return buildCalculatorUrl("/finance/retirement-corpus-calculator", Object.fromEntries(serializeRetirementUrlState(input)), origin) }
