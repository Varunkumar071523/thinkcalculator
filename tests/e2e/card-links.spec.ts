import { expect, test } from "@playwright/test"

// Regression test for a reported bug: calculator/blog card links appeared to 404 when clicked.
// Investigation found every card href was already a correct, absolute, canonical path (e.g.
// "/finance/emi-calculator") and real clicks navigated correctly — the report could not be
// reproduced against a fresh dev server. This test is the durable safety net either way: it
// visits /, /finance, and /blog, collects every in-page link's href, and asserts each one
// resolves to a real page (not a 404) via a direct HTTP request, so a future path-construction
// regression (relative hrefs, wrong slug lookups, stale route data) fails CI immediately instead
// of only showing up as a broken click in the browser.
const pages = ["/", "/finance", "/blog"]

function isInternalPath(href: string | null): href is string {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//")
}

test.describe("card links resolve to real pages", () => {
  for (const path of pages) {
    test(`every link on ${path} resolves (not a 404)`, async ({ page, request }) => {
      await page.goto(path)
      const hrefs = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")))
      const internalHrefs = [...new Set(hrefs.filter(isInternalPath).map((href) => href.split("?")[0].split("#")[0]).filter((href) => href !== ""))]
      expect(internalHrefs.length, `expected at least one internal link on ${path}`).toBeGreaterThan(0)

      for (const href of internalHrefs) {
        const response = await request.get(href)
        expect(response.status(), `${href} (linked from ${path}) should not 404`).toBeLessThan(400)
      }
    })
  }
})
