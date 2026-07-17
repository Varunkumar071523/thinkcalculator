import { describe, expect, it } from "vitest"

import { createMetroCityListNoticeText } from "../hra-content"
import {
  HRA_FINANCIAL_YEAR,
  HRA_FY2026_27_ADDITIONAL_METRO_CITIES,
  HRA_FY2026_27_METRO_LIST_SOURCE,
  HRA_RULE_SET,
} from "../hra-regulatory-config"

// Sprint 26 follow-up: this calculator is deliberately pinned to FY 2025-26's four-city metro
// list even though FY 2026-27 (the current financial year) expands it to eight cities. The notice
// text is the on-page disclosure of that gap, so it must name the calculator's own FY, the current
// FY 2025-26 city list, every newly-added city, and the statutory source — not just gesture at "a
// later financial year" the way the FAQ answer does.
describe("createMetroCityListNoticeText", () => {
  const text = createMetroCityListNoticeText()

  it("states which financial year the calculator currently uses", () => {
    expect(text).toContain(`FY ${HRA_FINANCIAL_YEAR}`)
  })

  it("names the current FY 2025-26 four-city metro list", () => {
    for (const city of HRA_RULE_SET.metroCities) expect(text).toContain(city)
  })

  it("names FY 2026-27 as the current financial year with the wider list", () => {
    expect(text).toContain("FY 2026-27")
  })

  it("names every city added from FY 2026-27", () => {
    for (const city of HRA_FY2026_27_ADDITIONAL_METRO_CITIES) expect(text).toContain(city)
  })

  it("cites the Income-tax Rules, 2026 as the source", () => {
    expect(text).toContain(HRA_FY2026_27_METRO_LIST_SOURCE)
  })

  it("does not silently claim the tool already treats the new cities as metro", () => {
    expect(text.toLowerCase()).toContain("even though it isn't yet listed")
  })
})
