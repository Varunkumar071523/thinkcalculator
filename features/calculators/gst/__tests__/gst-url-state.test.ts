import { describe, expect, it } from "vitest"
import { calculateGST } from "../calculate-gst"
import { buildGSTCalculatorUrl, GST_DEFAULT_INPUT, parseGSTUrlState, parseValidGSTUrlState, serializeGSTUrlState } from "../gst-url-state"

describe("GST URL state", () => {
  it("parses complete preset-rate state", () => { expect(parseValidGSTUrlState(new URLSearchParams("amount=1000&rate=18&mode=add&supply=intra-state"))).toEqual(GST_DEFAULT_INPUT) })
  it("parses and preserves complete custom-rate state", () => { expect(parseValidGSTUrlState(new URLSearchParams("amount=999.99&rate=7.5&mode=remove&supply=inter-state"))).toEqual({ amount: 999.99, gstRate: 7.5, calculationMode: "remove", supplyType: "inter-state" }) })
  it("round-trips the zero-rate option", () => { const input = { ...GST_DEFAULT_INPUT, gstRate: 0 }; expect(parseValidGSTUrlState(serializeGSTUrlState(input))).toEqual(input) })
  it("falls back as a whole for incomplete or malformed state", () => { for (const query of ["amount=1000&rate=18&mode=add", "amount=1e3&rate=18&mode=add&supply=intra-state", "amount=1000&rate=18&mode=other&supply=intra-state", "amount=1000&rate=18&mode=add&supply=local"]) expect(parseGSTUrlState(new URLSearchParams(query))).toEqual(GST_DEFAULT_INPUT) })
  it("rejects duplicate recognized keys", () => { expect(parseValidGSTUrlState(new URLSearchParams("amount=1000&amount=2000&rate=18&mode=add&supply=intra-state"))).toBeNull(); expect(parseValidGSTUrlState({ amount: ["1000", "2000"], rate: "18", mode: "add", supply: "intra-state" })).toBeNull() })
  it("rejects non-plain or over-precise numeric URL values", () => { for (const query of ["amount=1%2C000&rate=18&mode=add&supply=intra-state", "amount=1000&rate=7.555&mode=add&supply=intra-state", "amount=1000&rate=18%25&mode=add&supply=intra-state"]) expect(parseValidGSTUrlState(new URLSearchParams(query))).toBeNull() })
  it("ignores unrelated keys", () => { expect(parseValidGSTUrlState(new URLSearchParams("amount=1000&rate=18&mode=add&supply=intra-state&utm_source=test"))).toEqual(GST_DEFAULT_INPUT) })
  it("serializes only normalized recognized values with stable round trips", () => { const input = { amount: 1234.5, gstRate: 7.5, calculationMode: "remove" as const, supplyType: "inter-state" as const }; const serialized = serializeGSTUrlState(input); expect([...serialized.keys()]).toEqual(["amount", "rate", "mode", "supply"]); expect(parseValidGSTUrlState(serialized)).toEqual(input); expect(serializeGSTUrlState(parseValidGSTUrlState(serialized)!).toString()).toBe(serialized.toString()) })
  it("reproduces shared calculation output", () => { const input = { amount: 1180, gstRate: 18, calculationMode: "remove" as const, supplyType: "inter-state" as const }; expect(calculateGST(parseValidGSTUrlState(serializeGSTUrlState(input))!)).toEqual(calculateGST(input)) })
  it("keeps the canonical route clean while share URLs carry state", () => { expect(buildGSTCalculatorUrl(GST_DEFAULT_INPUT)).toBe("/business/gst-calculator?amount=1000&rate=18&mode=add&supply=intra-state") })
  it("rejects invalid state during serialization", () => { expect(() => serializeGSTUrlState({ ...GST_DEFAULT_INPUT, gstRate: 101 })).toThrow(RangeError) })
})
