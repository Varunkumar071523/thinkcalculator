import { describe, expect, it } from "vitest"

import {
  LEAVE_ENCASHMENT_DEFAULT_INPUT,
  buildLeaveEncashmentCalculatorUrl,
  parseLeaveEncashmentUrlState,
  parseValidLeaveEncashmentUrlState,
  serializeLeaveEncashmentUrlState,
} from "../leave-encashment-url-state"

const query = "type=non-government&lastDrawn=300000&avgSalary=260000&received=3200000&days=300&years=30&earnedPerYear=30&taxRate=30"

describe("Leave Encashment URL state", () => {
  it("parses valid parameters", () => {
    expect(parseLeaveEncashmentUrlState(new URLSearchParams(query))).toEqual(LEAVE_ENCASHMENT_DEFAULT_INPUT)
  })

  it("parses a government-employee scenario", () => {
    const govQuery = "type=government&lastDrawn=100000&avgSalary=90000&received=1500000&days=200&years=20&earnedPerYear=30&taxRate=20"
    expect(parseLeaveEncashmentUrlState(new URLSearchParams(govQuery))).toEqual({
      employeeType: "government",
      lastDrawnBasicSalary: 100_000,
      averageMonthlySalary: 90_000,
      leaveEncashmentAmountReceived: 1_500_000,
      leaveDaysEncashed: 200,
      yearsOfCompletedService: 20,
      leaveDaysEarnedPerYear: 30,
      marginalTaxRate: 20,
    })
  })

  it("uses defaults for missing parameters", () => {
    expect(parseLeaveEncashmentUrlState(new URLSearchParams())).toEqual(LEAVE_ENCASHMENT_DEFAULT_INPUT)
  })

  it("uses defaults when only some parameters are present", () => {
    expect(parseLeaveEncashmentUrlState(new URLSearchParams("type=government&lastDrawn=100000"))).toEqual(LEAVE_ENCASHMENT_DEFAULT_INPUT)
  })

  it("returns null from parseValidLeaveEncashmentUrlState for an invalid employee type", () => {
    expect(parseValidLeaveEncashmentUrlState(new URLSearchParams(query.replace("type=non-government", "type=contractor")))).toBeNull()
  })

  it("returns null for an out-of-range value", () => {
    expect(parseValidLeaveEncashmentUrlState(new URLSearchParams(query.replace("years=30", "years=999")))).toBeNull()
    expect(parseValidLeaveEncashmentUrlState(new URLSearchParams(query.replace("taxRate=30", "taxRate=25")))).toBeNull()
  })

  it("returns null for a non-finite value", () => {
    expect(parseValidLeaveEncashmentUrlState(new URLSearchParams(query.replace("received=3200000", "received=Infinity")))).toBeNull()
  })

  it("serializes valid input", () => {
    expect(serializeLeaveEncashmentUrlState(LEAVE_ENCASHMENT_DEFAULT_INPUT).toString()).toBe(query)
  })

  it("builds a canonical share URL", () => {
    expect(buildLeaveEncashmentCalculatorUrl(LEAVE_ENCASHMENT_DEFAULT_INPUT, "https://thinkcalculator.in")).toBe(`https://thinkcalculator.in/finance/leave-encashment-calculator?${query}`)
  })

  it("round trips", () => {
    expect(parseLeaveEncashmentUrlState(serializeLeaveEncashmentUrlState(LEAVE_ENCASHMENT_DEFAULT_INPUT))).toEqual(LEAVE_ENCASHMENT_DEFAULT_INPUT)
  })

  it("throws when serializing invalid input", () => {
    expect(() => serializeLeaveEncashmentUrlState({ ...LEAVE_ENCASHMENT_DEFAULT_INPUT, marginalTaxRate: 25 })).toThrow(RangeError)
  })
})
