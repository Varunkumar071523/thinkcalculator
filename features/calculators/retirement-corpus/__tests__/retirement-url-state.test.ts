import { describe, expect, it } from "vitest"
import { parseRetirementUrlState, parseValidRetirementUrlState, RETIREMENT_DEFAULT_INPUT, serializeRetirementUrlState } from "../retirement-url-state"
import type { RetirementInput } from "../retirement-types"

const input: RetirementInput = {
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

describe("Retirement Corpus URL state", () => {
  it("round trips valid input, including a negative inflation rate and unequal return rates", () => {
    for (const candidate of [input, { ...input, inflationRate: -2 }, { ...input, expectedReturnPostRetirement: 7 }]) {
      expect(parseValidRetirementUrlState(serializeRetirementUrlState(candidate))).toEqual(candidate)
    }
  })

  it.each([
    "age=30",
    "age=30&retireAge=60&life=85&savings=500000&contribution=15000&preReturn=10&postReturn=10&withdrawal=50000&inflation=x",
    "age=3e1&retireAge=60&life=85&savings=500000&contribution=15000&preReturn=10&postReturn=10&withdrawal=50000&inflation=6",
    "age=30&retireAge=60&life=85&savings=500000&contribution=15000&preReturn=10&postReturn=10&withdrawal=%20&inflation=6",
    "age=30&retireAge=30&life=85&savings=500000&contribution=15000&preReturn=10&postReturn=10&withdrawal=50000&inflation=6",
    "age=30&retireAge=60&life=60&savings=500000&contribution=15000&preReturn=10&postReturn=10&withdrawal=50000&inflation=6",
  ])("rejects partial or malformed state: %s", (query) => expect(parseValidRetirementUrlState(new URLSearchParams(query))).toBeNull())

  it("ignores unknown keys and uses a whole-state default for invalid URLs", () => {
    const query = serializeRetirementUrlState(input)
    query.set("unknown", "x")
    expect(parseValidRetirementUrlState(query)).toEqual(input)
    expect(parseRetirementUrlState(new URLSearchParams("age=30"))).toEqual(RETIREMENT_DEFAULT_INPUT)
  })

  it("serializes fields in deterministic order", () => {
    expect([...serializeRetirementUrlState(input).keys()]).toEqual(["age", "retireAge", "life", "savings", "contribution", "preReturn", "postReturn", "withdrawal", "inflation"])
  })

  it("throws when serializing invalid input", () => {
    expect(() => serializeRetirementUrlState({ ...input, currentAge: 5 })).toThrow(RangeError)
  })
})
