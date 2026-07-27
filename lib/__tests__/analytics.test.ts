import { afterEach, describe, expect, it, vi } from "vitest"

import {
  applyConsentUpdate,
  buildCalculatorEventPayload,
  CONSENT_STORAGE_KEY,
  readConsentChoice,
  stripPageLocationQuery,
  trackEvent,
  writeConsentChoice,
} from "@/lib/analytics"

function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
}

// Sprint 45: this is the exact leak-prevention mechanism the google-analytics.tsx inline script
// applies to `page_location` at runtime — see lib/analytics.ts's doc comment on
// stripPageLocationQuery for why the logic is duplicated here in a directly testable form.
describe("stripPageLocationQuery", () => {
  it("drops a query string carrying calculator input values, keeping origin + pathname", () => {
    expect(stripPageLocationQuery("https://thinkcalculator.in/finance/emi-calculator?amount=500000&rate=9.5&tenure=20")).toBe(
      "https://thinkcalculator.in/finance/emi-calculator",
    )
  })

  it("is a no-op for a URL with no query string", () => {
    expect(stripPageLocationQuery("https://thinkcalculator.in/finance/emi-calculator")).toBe("https://thinkcalculator.in/finance/emi-calculator")
  })

  it("also drops a hash fragment", () => {
    expect(stripPageLocationQuery("https://thinkcalculator.in/glossary/emi#formula")).toBe("https://thinkcalculator.in/glossary/emi")
  })

  it("preserves a nested pathname", () => {
    expect(stripPageLocationQuery("https://thinkcalculator.in/finance/income-tax-calculator/?grossIncome=1500000")).toBe(
      "https://thinkcalculator.in/finance/income-tax-calculator/",
    )
  })
})

describe("consent storage", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("returns null when window is unavailable (SSR/static prerender)", () => {
    expect(readConsentChoice()).toBeNull()
  })

  it("returns null when nothing has been stored yet", () => {
    vi.stubGlobal("window", { localStorage: createMemoryStorage() })
    expect(readConsentChoice()).toBeNull()
  })

  it("round-trips a granted choice", () => {
    vi.stubGlobal("window", { localStorage: createMemoryStorage() })
    writeConsentChoice("granted")
    expect(readConsentChoice()).toBe("granted")
  })

  it("round-trips a denied choice", () => {
    vi.stubGlobal("window", { localStorage: createMemoryStorage() })
    writeConsentChoice("denied")
    expect(readConsentChoice()).toBe("denied")
  })

  it("treats a malformed stored value as no choice, not a crash", () => {
    const storage = createMemoryStorage()
    storage.setItem(CONSENT_STORAGE_KEY, "yes-please")
    vi.stubGlobal("window", { localStorage: storage })
    expect(readConsentChoice()).toBeNull()
  })

  it("degrades to null (never throws) when localStorage access itself throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("storage disabled")
        },
      },
    })
    expect(readConsentChoice()).toBeNull()
  })
})

describe("trackEvent — consent gating", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("does not call gtag when no consent choice has been made", () => {
    const calls: unknown[][] = []
    vi.stubGlobal("window", { localStorage: createMemoryStorage(), gtag: (...args: unknown[]) => calls.push(args) })
    trackEvent("calculation_completed", buildCalculatorEventPayload("emi", "loans"))
    expect(calls).toHaveLength(0)
  })

  it("does not call gtag when consent was declined", () => {
    const storage = createMemoryStorage()
    storage.setItem(CONSENT_STORAGE_KEY, "denied")
    const calls: unknown[][] = []
    vi.stubGlobal("window", { localStorage: storage, gtag: (...args: unknown[]) => calls.push(args) })
    trackEvent("calculation_completed", buildCalculatorEventPayload("emi", "loans"))
    expect(calls).toHaveLength(0)
  })

  it("does not call gtag when analytics is disabled for this build (window.gtag was never defined)", () => {
    const storage = createMemoryStorage()
    storage.setItem(CONSENT_STORAGE_KEY, "granted")
    vi.stubGlobal("window", { localStorage: storage })
    expect(() => trackEvent("calculation_completed", buildCalculatorEventPayload("emi", "loans"))).not.toThrow()
  })

  it("calls gtag with the event once consent is granted", () => {
    const storage = createMemoryStorage()
    storage.setItem(CONSENT_STORAGE_KEY, "granted")
    const calls: unknown[][] = []
    vi.stubGlobal("window", { localStorage: storage, gtag: (...args: unknown[]) => calls.push(args) })
    trackEvent("calculation_completed", buildCalculatorEventPayload("emi", "loans"))
    expect(calls).toEqual([["event", "calculation_completed", { calculator_type: "emi", category: "loans" }]])
  })
})

describe("applyConsentUpdate", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("defines window.gtag if missing, then queues the Consent Mode update", () => {
    const fakeWindow: { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } = {}
    vi.stubGlobal("window", fakeWindow)
    applyConsentUpdate("granted")
    expect(typeof fakeWindow.gtag).toBe("function")
    expect(fakeWindow.dataLayer).toEqual([["consent", "update", { analytics_storage: "granted" }]])
  })
})

// The structural guarantee the whole consent/event system exists to prove: at least 3 different
// calculators' event payloads carry only calculator identifiers, never a numeric input or result
// value. See tests/e2e/analytics.spec.ts for the same guarantee proven end-to-end through real
// calculator components, not just this pure builder function.
describe("buildCalculatorEventPayload — no numeric values ever leak into an event payload", () => {
  const calculators: readonly [calculatorType: string, category: string][] = [
    ["emi", "loans"],
    ["sip", "investments"],
    ["income-tax", "taxes"],
    ["fd", "savings"],
    ["gst", "business"],
  ]

  it.each(calculators)("payload for %s (%s) contains only calculator_type and category", (calculatorType, category) => {
    const payload = buildCalculatorEventPayload(calculatorType, category)
    expect(Object.keys(payload).sort()).toEqual(["calculator_type", "category"])
    expect(payload).toEqual({ calculator_type: calculatorType, category })
    for (const value of Object.values(payload)) {
      expect(typeof value).toBe("string")
      // Guards against a future call site accidentally passing a stringified number
      // (e.g. `String(loanAmount)`) instead of a real calculator/category identifier.
      expect(value).not.toMatch(/^-?\d+(\.\d+)?$/)
    }
  })
})
