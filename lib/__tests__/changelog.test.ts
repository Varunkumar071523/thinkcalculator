import { describe, expect, it } from "vitest"

import { HRA_FINANCIAL_YEAR, HRA_FY2026_27_ADDITIONAL_METRO_CITIES } from "@/features/calculators/hra/hra-regulatory-config"
import { changelogEntries, getRecentChangelogEntries } from "@/lib/changelog"
import { FY2025_26_RULES } from "@/lib/tax/rules/fy2025-26"

describe("changelog data", () => {
  it("seeds the FY2025-26 slab confirmation and the metro-city HRA disclosure", () => {
    const titles = changelogEntries.map((entry) => entry.title)
    expect(titles.some((title) => title.includes(FY2025_26_RULES.financialYear) && title.toLowerCase().includes("slab"))).toBe(true)
    expect(titles.some((title) => title.toLowerCase().includes("metro"))).toBe(true)
  })

  it("pulls the financial year and metro-city facts from the same source of truth the calculators use, not a hardcoded duplicate", () => {
    for (const entry of changelogEntries) {
      if (entry.title.includes("slab")) expect(entry.description).toContain(FY2025_26_RULES.financialYear)
      if (entry.title.toLowerCase().includes("metro")) {
        for (const city of HRA_FY2026_27_ADDITIONAL_METRO_CITIES) expect(entry.description).toContain(city)
        expect(entry.description).toContain(HRA_FINANCIAL_YEAR)
      }
    }
  })

  it("every entry has a valid ISO date and non-empty title/description", () => {
    for (const entry of changelogEntries) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(entry.title.length).toBeGreaterThan(0)
      expect(entry.description.length).toBeGreaterThan(0)
    }
  })
})

describe("getRecentChangelogEntries", () => {
  it("sorts most-recent-first", () => {
    const entries = getRecentChangelogEntries(10)
    const dates = entries.map((entry) => entry.date)
    const sorted = [...dates].sort((a, b) => b.localeCompare(a))
    expect(dates).toEqual(sorted)
  })

  it("caps to the requested limit", () => {
    expect(getRecentChangelogEntries(2)).toHaveLength(2)
    expect(getRecentChangelogEntries(4).length).toBeLessThanOrEqual(4)
  })

  it("defaults to capping at 4 entries for the homepage block", () => {
    expect(getRecentChangelogEntries().length).toBeLessThanOrEqual(4)
  })
})
