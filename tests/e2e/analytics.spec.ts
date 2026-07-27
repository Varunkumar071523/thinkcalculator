import { expect, test } from "@playwright/test"

// Sprint 36: GA4 is gated on STATIC_EXPORT=true (see lib/analytics-config.ts) — the Playwright
// suite always runs against a plain `next build` + `next start` (package.json's "test" script),
// which never sets that flag, so GA4 must never be present here. This is a real assertion against
// the served page, not a manual check, so a future regression that accidentally loosens the gate
// would fail this test rather than silently shipping.
test.describe("analytics", () => {
  test("GA4 does not load in the e2e test environment", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0)
    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer?: unknown }).dataLayer)
    expect(dataLayer).toBeUndefined()
  })

  // This does not depend on GA4 actually being enabled in this environment (it never is here — see
  // above). It stubs a minimal gtag/dataLayer itself, as if GA4 were present, so the assertion
  // proves something stronger than "GA4 is off in tests": it proves no code path in the app ever
  // calls gtag/dataLayer.push with a calculator input value, which is the actual production
  // constraint regardless of whether analytics happens to be enabled.
  test("calculator input values are never pushed to gtag or dataLayer", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
      w.dataLayer = []
      w.gtag = (...args: unknown[]) => w.dataLayer.push(args)
    })

    // A distinctive, unlikely-to-appear-incidentally value standing in for a real user's PII.
    // Must stay within EMI_LIMITS.principalAmount (₹10,000-₹10,00,00,000, see emi-schema.ts) or
    // the calculator's own validation would reject it before it ever reaches the assertion.
    const sentinel = "78946135"

    await page.goto("/finance/emi-calculator")
    await page.locator("#loan-amount").fill(sentinel)
    await page.locator("#annual-interest-rate").fill("9.5")
    await page.locator("#loan-tenure").fill("5")
    // Live — no "Calculate" click needed; the result panel already reflects the typed values.
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()

    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer)
    const serialized = JSON.stringify(dataLayer)
    expect(serialized).not.toContain(sentinel)
  })

  test("opening a calculator via a share-style URL with query values does not push them to dataLayer either", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
      w.dataLayer = []
      w.gtag = (...args: unknown[]) => w.dataLayer.push(args)
    })

    const sentinel = "83214597"
    await page.goto(`/finance/emi-calculator?amount=${sentinel}&rate=9.5&tenure=5&unit=years`)
    await expect(page.locator("#loan-amount")).toHaveValue(sentinel)

    const dataLayer = await page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer)
    const serialized = JSON.stringify(dataLayer)
    expect(serialized).not.toContain(sentinel)
    // The current page URL itself still contains it (that's the calculator's own restore feature,
    // unrelated to analytics) — what matters here is only that nothing was pushed to gtag/dataLayer.
    expect(page.url()).toContain(sentinel)
  })
})

// Sprint 45: calculation_completed / result_shared custom events, and the consent gate in front
// of them (lib/analytics.ts's trackEvent). These tests stub gtag exactly like the block above
// (GA4 itself is never enabled in this e2e environment — see the top-of-file comment), and
// additionally pre-seed localStorage with a "granted" consent choice via addInitScript, so the
// consent-gated code path inside trackEvent actually executes instead of no-op'ing. This proves,
// through the real hook + component integration (not just the pure builder function tested in
// lib/__tests__/analytics.test.ts), that at least 3 different calculators' event payloads never
// carry a numeric input or result value — only calculator_type/category identifiers.
test.describe("custom events — consent gating and no-PII payloads", () => {
  function stubGtagWithGrantedConsent(page: import("@playwright/test").Page) {
    return page.addInitScript(() => {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
      w.dataLayer = []
      w.gtag = (...args: unknown[]) => w.dataLayer.push(args)
      window.localStorage.setItem("tc-analytics-consent", "granted")
    })
  }

  async function readDataLayer(page: import("@playwright/test").Page) {
    return page.evaluate(() => (window as unknown as { dataLayer: unknown[] }).dataLayer)
  }

  test("EMI: calculation_completed fires with only calculator identifiers, no loan amount", async ({ page }) => {
    await stubGtagWithGrantedConsent(page)
    const sentinel = "78123469"

    await page.goto("/finance/emi-calculator")
    await page.locator("#loan-amount").fill(sentinel)
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()

    await page.waitForFunction(() => {
      const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer
      return dataLayer.some((call) => Array.isArray(call) && call[0] === "event" && call[1] === "calculation_completed")
    })

    const dataLayer = await readDataLayer(page)
    expect(JSON.stringify(dataLayer)).not.toContain(sentinel)
    expect(dataLayer).toContainEqual(["event", "calculation_completed", { calculator_type: "emi", category: "loans" }])
  })

  test("rapid successive input changes debounce to exactly one calculation_completed event, not one per change", async ({ page }) => {
    await stubGtagWithGrantedConsent(page)

    await page.goto("/finance/emi-calculator")
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()

    // The calculator also (correctly) fires calculation_completed for its own default-value
    // result on mount — that's intended, not a bug. Wait for that one to land before starting the
    // burst below, then clear it out. Without this, whether the mount's event survives as a
    // second, independent event depends on the gap between "page reports visible" and "this test's
    // own next automation step actually starts running" — pure Playwright/browser IPC latency, not
    // app behavior, confirmed by raw timer instrumentation to occasionally exceed 800ms on its own
    // even though every dispatch inside the burst itself is always correctly coalesced into a
    // single debounce window. Waiting for the mount event to land first removes that race
    // entirely instead of narrowing it.
    await page.waitForFunction(() => {
      const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer
      return dataLayer.some((call) => Array.isArray(call) && call[0] === "event" && call[1] === "calculation_completed")
    })
    await page.evaluate(() => {
      ;(window as unknown as { dataLayer: unknown[] }).dataLayer.length = 0
    })

    // Driven from a single evaluate() call, not seven separate Playwright .fill() actions: each
    // .fill() round-trips through the browser's own automation protocol, and that per-call
    // latency measurably differs enough between engines (confirmed: Firefox specifically let
    // more than 800ms elapse between two separate .fill() calls in an earlier version of this
    // test, closing features/calculators/core/use-track-calculation.ts's debounce window between
    // them and legitimately producing more than one event) that it isn't a reliable way to prove
    // "these changes all happen within milliseconds of each other" — that would be testing the
    // test driver's timing, not the debounce logic.
    //
    // Each dispatch is still its own discrete React render (a short `setTimeout`-based delay
    // between them, not a synchronous back-to-back loop) — that's the realistic shape of the
    // scenario under test (a user typing digit-by-digit or dragging a slider produces one render
    // per change, not one batched render for the whole gesture), and it also sidesteps a
    // cross-engine React 18 automatic-batching nuance: dispatching all seven native `input`
    // events synchronously in one tight loop was observed to occasionally still produce 2 events
    // on Firefox/WebKit (never on Chromium), because whether React batches several
    // same-tick-but-separately-dispatched native events into a single render is an
    // engine-sensitive scheduling detail, not something this test should depend on either way —
    // the debounce hook only needs to handle "one render per change," which every real user
    // interaction actually produces. 60ms apart is comfortably under the 800ms debounce window
    // (features/calculators/core/use-track-calculation.ts's `SETTLE_DELAY_MS`) while still being
    // far faster than any human could plausibly move a slider or type.
    //
    // Uses the native input value setter (not `input.value = ...` directly) because React's
    // controlled-input tracking intercepts the plain setter and would otherwise ignore a
    // same-element value change with no state update observed in between — the standard technique
    // for simulating input on a React controlled input from raw DOM.
    await page.evaluate(async () => {
      const input = document.querySelector("#loan-amount") as HTMLInputElement
      const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!
      for (const value of ["510000", "520000", "530000", "540000", "550000", "560000", "570000"]) {
        nativeValueSetter.call(input, value)
        input.dispatchEvent(new Event("input", { bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 60))
      }
    })

    await page.waitForFunction(() => {
      const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer
      return dataLayer.some((call) => Array.isArray(call) && call[0] === "event" && call[1] === "calculation_completed")
    })
    // Give any extra (incorrect) per-change events time to land before counting.
    await page.waitForTimeout(500)

    const dataLayer = await readDataLayer(page)
    const completedEvents = dataLayer.filter((call) => Array.isArray(call) && call[0] === "event" && call[1] === "calculation_completed")
    expect(completedEvents).toHaveLength(1)
    expect(completedEvents[0]).toEqual(["event", "calculation_completed", { calculator_type: "emi", category: "loans" }])
  })

  test("SIP: calculation_completed fires with only calculator identifiers, no investment amount", async ({ page }) => {
    await stubGtagWithGrantedConsent(page)
    const sentinel = "834162"

    await page.goto("/finance/sip-calculator")
    await page.locator("#monthly-investment").fill(sentinel)
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()

    await page.waitForFunction(() => {
      const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer
      return dataLayer.some((call) => Array.isArray(call) && call[0] === "event" && call[1] === "calculation_completed")
    })

    const dataLayer = await readDataLayer(page)
    expect(JSON.stringify(dataLayer)).not.toContain(sentinel)
    expect(dataLayer).toContainEqual(["event", "calculation_completed", { calculator_type: "sip", category: "investments" }])
  })

  test("Income tax: calculation_completed fires with only calculator identifiers, no income figure", async ({ page }) => {
    await stubGtagWithGrantedConsent(page)
    const sentinel = "12345678"

    await page.goto("/finance/income-tax-calculator")
    await page.locator("#gross-income").fill(sentinel)
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()

    await page.waitForFunction(() => {
      const dataLayer = (window as unknown as { dataLayer: unknown[] }).dataLayer
      return dataLayer.some((call) => Array.isArray(call) && call[0] === "event" && call[1] === "calculation_completed")
    })

    const dataLayer = await readDataLayer(page)
    expect(JSON.stringify(dataLayer)).not.toContain(sentinel)
    expect(dataLayer).toContainEqual(["event", "calculation_completed", { calculator_type: "income-tax", category: "taxes" }])
  })

  test("result_shared fires on Copy share link, with only calculator identifiers, no query-string values", async ({ page }) => {
    await stubGtagWithGrantedConsent(page)
    const sentinel = "78946135"

    await page.goto("/finance/emi-calculator")
    await page.locator("#loan-amount").fill(sentinel)
    await page.getByRole("button", { name: /copy share link/i }).click()

    const dataLayer = await readDataLayer(page)
    expect(JSON.stringify(dataLayer)).not.toContain(sentinel)
    expect(dataLayer).toContainEqual(["event", "result_shared", { calculator_type: "emi", category: "loans" }])
  })

  test("no calculation_completed event fires when consent has not been granted", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
      w.dataLayer = []
      w.gtag = (...args: unknown[]) => w.dataLayer.push(args)
      // Deliberately no localStorage consent choice set — the default, undecided state.
    })

    await page.goto("/finance/emi-calculator")
    await page.locator("#loan-amount").fill("650000")
    await expect(page.getByTestId("calculator-result-card")).toBeVisible()
    // Give the 800ms debounce (features/calculators/core/use-track-calculation.ts) time to fire
    // if it were going to, incorrectly, despite no consent.
    await page.waitForTimeout(1200)

    const dataLayer = await readDataLayer(page)
    expect(dataLayer.some((call) => Array.isArray(call) && call[0] === "event")).toBe(false)
  })
})
