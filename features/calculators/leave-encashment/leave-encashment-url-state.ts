import { buildCalculatorUrl } from "@/lib/calculator-url"
import { parseLeaveEncashmentNumericText, validateLeaveEncashmentInput } from "./leave-encashment-schema"
import type { LeaveEncashmentEmployeeType, LeaveEncashmentInput } from "./leave-encashment-types"

/** A non-government employee example chosen so the ₹25 lakh statutory limit is the binding
 * constraint (2,500,000 is the least of all four components), not a trivial full-exemption
 * case — see leave-encashment-content.ts's worked example for the component-by-component walk. */
export const LEAVE_ENCASHMENT_DEFAULT_INPUT: LeaveEncashmentInput = {
  employeeType: "non-government",
  lastDrawnBasicSalary: 300_000,
  averageMonthlySalary: 260_000,
  leaveEncashmentAmountReceived: 3_200_000,
  leaveDaysEncashed: 300,
  yearsOfCompletedService: 30,
  leaveDaysEarnedPerYear: 30,
  marginalTaxRate: 30,
}

type SearchInput = URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
const keys = ["type", "lastDrawn", "avgSalary", "received", "days", "years", "earnedPerYear", "taxRate"] as const

function readOne(search: SearchInput, key: (typeof keys)[number]): string | undefined {
  if (search instanceof URLSearchParams) {
    const values = search.getAll(key)
    return values.length === 1 ? values[0] : undefined
  }
  const value = search[key]
  return typeof value === "string" ? value : undefined
}

export function parseValidLeaveEncashmentUrlState(search: SearchInput): LeaveEncashmentInput | null {
  const recognised = keys.filter((key) => (search instanceof URLSearchParams ? search.has(key) : search[key] !== undefined))
  if (recognised.length !== keys.length) return null

  const employeeType = readOne(search, "type") as LeaveEncashmentEmployeeType | undefined
  const lastDrawnBasicSalary = parseLeaveEncashmentNumericText(readOne(search, "lastDrawn") ?? "")
  const averageMonthlySalary = parseLeaveEncashmentNumericText(readOne(search, "avgSalary") ?? "")
  const leaveEncashmentAmountReceived = parseLeaveEncashmentNumericText(readOne(search, "received") ?? "")
  const leaveDaysEncashed = parseLeaveEncashmentNumericText(readOne(search, "days") ?? "")
  const yearsOfCompletedService = parseLeaveEncashmentNumericText(readOne(search, "years") ?? "")
  const leaveDaysEarnedPerYear = parseLeaveEncashmentNumericText(readOne(search, "earnedPerYear") ?? "")
  const marginalTaxRate = parseLeaveEncashmentNumericText(readOne(search, "taxRate") ?? "")

  if (
    !employeeType
    || lastDrawnBasicSalary === null
    || averageMonthlySalary === null
    || leaveEncashmentAmountReceived === null
    || leaveDaysEncashed === null
    || yearsOfCompletedService === null
    || leaveDaysEarnedPerYear === null
    || marginalTaxRate === null
  ) return null

  const validation = validateLeaveEncashmentInput({
    employeeType,
    lastDrawnBasicSalary,
    averageMonthlySalary,
    leaveEncashmentAmountReceived,
    leaveDaysEncashed,
    yearsOfCompletedService,
    leaveDaysEarnedPerYear,
    marginalTaxRate,
  })
  return validation.success ? validation.data : null
}

export function parseLeaveEncashmentUrlState(search: SearchInput, defaults: LeaveEncashmentInput = LEAVE_ENCASHMENT_DEFAULT_INPUT): LeaveEncashmentInput {
  return parseValidLeaveEncashmentUrlState(search) ?? defaults
}

export function serializeLeaveEncashmentUrlState(input: LeaveEncashmentInput): URLSearchParams {
  if (!validateLeaveEncashmentInput(input).success) throw new RangeError("Invalid leave encashment URL state")
  return new URLSearchParams({
    type: input.employeeType,
    lastDrawn: String(input.lastDrawnBasicSalary),
    avgSalary: String(input.averageMonthlySalary),
    received: String(input.leaveEncashmentAmountReceived),
    days: String(input.leaveDaysEncashed),
    years: String(input.yearsOfCompletedService),
    earnedPerYear: String(input.leaveDaysEarnedPerYear),
    taxRate: String(input.marginalTaxRate),
  })
}

export function buildLeaveEncashmentCalculatorUrl(input: LeaveEncashmentInput, origin?: string): string {
  return buildCalculatorUrl(
    "/finance/leave-encashment-calculator",
    Object.fromEntries(serializeLeaveEncashmentUrlState(input)),
    origin,
  )
}
