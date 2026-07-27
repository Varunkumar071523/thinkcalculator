import { expect, test, type Page, type Route } from "@playwright/test"

// Runs only via `npm run test:e2e:analytics` (scripts/run-e2e-analytics.mjs), against a real
// STATIC_EXPORT=true build with GA4 enabled — see playwright.analytics.config.ts's comment for
// why this is a separate suite from tests/e2e/.
//
// Real gtag.js is never fetched from googletagmanager.com here: every test intercepts that
// request and serves a small local stub (`GTAG_STUB_SCRIPT` below) that reproduces just enough of
// gtag.js's real behavior — draining `window.dataLayer`, tracking Consent Mode's
// `analytics_storage` state, and only firing a network "hit" once that state is `granted` — to
// prove this app's own consent wiring end-to-end without depending on Google's actual minified
// script (undocumented internal timing, and a real external fetch this sandboxed suite shouldn't
// depend on). The `dl` (page_location) query parameter on that hit is populated straight from
// this app's own `gtag('config', ...)` call, so asserting on it still proves the real
// `page_location` query-stripping code in components/analytics/google-analytics.tsx, not the
// stub's own logic.
const GTAG_STUB_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  var __consent = { analytics_storage: "denied" };
  // Real Consent Mode v2 doesn't just drop a hit attempted while denied — it holds it and
  // resends once consent is granted (that's the entire point of \`wait_for_update\`). Reproduced
  // here with an explicit pending queue so a granted-after-the-fact Accept click still produces
  // the hit this test asserts on, matching real GA4 behavior rather than a simplified drop.
  var __pending = [];
  function __send(name, params) {
    if (__consent.analytics_storage !== "granted") { __pending.push({ name: name, params: params }); return; }
    var location = (params && params.page_location) || "";
    fetch("https://www.google-analytics.com/g/collect?en=" + encodeURIComponent(name) + "&dl=" + encodeURIComponent(location), { mode: "no-cors" }).catch(function () {});
  }
  function __flushPending() {
    var toSend = __pending;
    __pending = [];
    toSend.forEach(function (item) { __send(item.name, item.params); });
  }
  function __process(entry) {
    var type = entry[0];
    if (type === "consent") {
      var action = entry[1], params = entry[2] || {};
      if (action === "default" || action === "update") {
        var wasGranted = __consent.analytics_storage === "granted";
        __consent = Object.assign({}, __consent, params);
        if (!wasGranted && __consent.analytics_storage === "granted") __flushPending();
      }
      return;
    }
    if (type === "config") { __send("page_view", entry[2] || {}); return; }
    if (type === "event") { __send(entry[1], entry[2] || {}); return; }
  }
  var __already = window.dataLayer.slice();
  var __nativePush = Array.prototype.push;
  window.dataLayer.push = function () {
    // Each argument to .push() is itself one gtag() call's arguments-list (real gtag.js's own
    // shim does \`dataLayer.push(arguments)\` per call — one push per call, not a batch), so each
    // must be processed individually, not the outer arguments list as a single (wrongly nested)
    // entry.
    for (var i = 0; i < arguments.length; i++) __process(arguments[i]);
    return __nativePush.apply(window.dataLayer, arguments);
  };
  __already.forEach(function (entry) { __process(entry); });
`

async function stubGtagScript(page: Page) {
  await page.route("https://www.googletagmanager.com/**", (route: Route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: GTAG_STUB_SCRIPT }),
  )
}

function trackCollectRequests(page: Page): string[] {
  const urls: string[] = []
  page.on("request", (request) => {
    if (request.url().startsWith("https://www.google-analytics.com/g/collect")) urls.push(request.url())
  })
  return urls
}

test.describe("GA4 consent banner (static export)", () => {
  test("gtag.js is present and the consent banner renders, gated on the STATIC_EXPORT build", async ({ page }) => {
    await stubGtagScript(page)
    await page.goto("/")

    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1)
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Accept" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Decline" })).toBeVisible()
  })

  test("declining consent: no GA4 collect request ever fires", async ({ page }) => {
    await stubGtagScript(page)
    const collectRequests = trackCollectRequests(page)

    await page.goto("/")
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeVisible()

    // Consent Mode's default is `denied` from the moment the page's own init script runs, before
    // this banner is even clicked — the automatic page_view `config` call already attempted above
    // must not have produced a hit yet either.
    expect(collectRequests).toHaveLength(0)

    await page.getByRole("button", { name: "Decline" }).click()
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeHidden()

    // Give any (incorrectly) in-flight hit time to land before asserting none did.
    await page.waitForTimeout(500)
    expect(collectRequests).toHaveLength(0)
  })

  test("accepting consent: a hit fires with page_location stripped of the share-link query string", async ({ page }) => {
    await stubGtagScript(page)
    const collectRequests = trackCollectRequests(page)

    // A share-link-shaped URL (see components/calculators/calculator-actions.tsx) — the same
    // vector docs/DECISIONS.md documents as the reason `page_location` is overridden at all.
    await page.goto("/finance/emi-calculator?amount=500000&rate=9.5&tenure=20&unit=years")
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeVisible()

    // The FAQ search widget's floating trigger (components/faq-search/faq-search-widget.tsx)
    // occupies the same bottom-right corner as this banner's Accept button on narrower content
    // pages and can sit on top of it — a plain click (or even Playwright's `force: true`, which
    // still dispatches a real pointer event at the target's screen coordinates and would hit
    // whichever element is actually topmost there) can land on the wrong element. Removing the
    // widget's trigger outright is more reliable than fighting z-order in the test.
    await page.evaluate(() => {
      document.querySelectorAll('[aria-label="Ask a question about ThinkCalculator"]').forEach((el) => el.remove())
    })

    await page.getByRole("button", { name: "Accept" }).click()
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeHidden()

    await expect.poll(() => collectRequests.length, { timeout: 10_000 }).toBeGreaterThan(0)

    const dl = new URL(collectRequests[0]).searchParams.get("dl") ?? ""
    expect(dl).not.toContain("amount=500000")
    expect(dl).not.toContain("500000")
    expect(dl.endsWith("/finance/emi-calculator/") || dl.endsWith("/finance/emi-calculator")).toBe(true)
  })
})

// Sprint 45 follow-up: a returning visitor's stored "granted" choice must be replayed against
// Consent Mode *synchronously* (components/analytics/google-analytics.tsx's own inline script),
// not from a React effect in ConsentBanner. The original effect-based replay left a real gap
// between "consent defaults to denied" and "the stored choice is reapplied" during which a
// fast-firing event — `result_shared` in particular, which can fire the instant a user clicks,
// with no debounce — could be evaluated by gtag.js while its internal consent state was still
// `denied` and silently dropped (gtag.js evaluates each call's consent state at the moment it's
// processed; without a `wait_for_update` window, a call made before the replay lands is not
// queued for later, unlike a call made after Accept mid-session, which the pending-queue stub
// above deliberately models separately). These tests prove the fix: for a returning visitor, no
// banner ever appears, and an event fired essentially as fast as a real user/script can act is
// still delivered correctly.
test.describe("GA4 consent banner — returning visitor (pre-existing granted choice)", () => {
  function seedGrantedConsent(page: Page) {
    return page.addInitScript(() => {
      window.localStorage.setItem("tc-analytics-consent", "granted")
    })
  }

  function eventNames(collectRequests: readonly string[]): (string | null)[] {
    return collectRequests.map((url) => new URL(url).searchParams.get("en"))
  }

  test("result_shared fires immediately on click with the correct payload — no banner, no ambiguous consent state", async ({ page }) => {
    await stubGtagScript(page)
    await seedGrantedConsent(page)
    const collectRequests = trackCollectRequests(page)

    await page.goto("/finance/emi-calculator")
    // The banner must never render at all for a returning consented visitor — proving the
    // synchronous replay in google-analytics.tsx already ran before this assertion, with no
    // window in which the visitor could see (or need) it.
    await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0)

    // The automatic `page_view` hit (from the `config` call) is expected to have already fired by
    // now too — that's the fix working, not a bug: consent was already `granted` synchronously
    // before any app code ran, so nothing was held back the way it is for a first-time visitor.
    // `collectRequests` may legitimately already contain it; only the presence of `result_shared`
    // matters here, not what arrived first.

    await page.evaluate(() => {
      document.querySelectorAll('[aria-label="Ask a question about ThinkCalculator"]').forEach((el) => el.remove())
    })
    // No extra wait beyond what Playwright's own actionability check requires — this is
    // deliberately "as fast as a real click can happen after the page becomes interactive."
    await page.getByRole("button", { name: "Copy share link" }).click()

    await expect.poll(() => eventNames(collectRequests), { timeout: 10_000 }).toContain("result_shared")
  })

  test("calculation_completed still fires for a returning visitor with a result already present at mount", async ({ page }) => {
    await stubGtagScript(page)
    await seedGrantedConsent(page)
    const collectRequests = trackCollectRequests(page)

    // Query-prefilled so a result exists from the very first render — the debounced event's
    // 800ms timer starts as early as possible after mount, maximizing overlap with the window
    // this test is checking.
    await page.goto("/finance/emi-calculator?amount=650000&rate=8.5&tenure=15&unit=years")
    await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0)

    // Two hits are expected before this resolves: the automatic `page_view` (near-immediate,
    // since consent was already granted) and, ~800ms later, `calculation_completed` — polling on
    // the specific event name (not just "any hit arrived") avoids stopping early on the former.
    await expect.poll(() => eventNames(collectRequests), { timeout: 10_000 }).toContain("calculation_completed")
  })
})
