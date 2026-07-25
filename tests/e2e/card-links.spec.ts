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

async function assertHrefsResolve(request: import("@playwright/test").APIRequestContext, hrefs: readonly string[], sourceLabel: string) {
  for (const href of hrefs) {
    const response = await request.get(href)
    expect(response.status(), `${href} (linked from ${sourceLabel}) should not 404`).toBeLessThan(400)
  }
}

test.describe("card links resolve to real pages", () => {
  for (const path of pages) {
    test(`every link on ${path} resolves (not a 404)`, async ({ page, request }) => {
      await page.goto(path)
      const hrefs = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")))
      const internalHrefs = [...new Set(hrefs.filter(isInternalPath).map((href) => href.split("?")[0].split("#")[0]).filter((href) => href !== ""))]
      expect(internalHrefs.length, `expected at least one internal link on ${path}`).toBeGreaterThan(0)

      await assertHrefsResolve(request, internalHrefs, path)
    })
  }
})

// Sprint 42: category filter chips on the blog listing page must never break card links —
// selecting a category re-renders the grid client-side, and this guards against a filtered
// render producing a stale or malformed href.
test.describe("blog category filter chips", () => {
  test("degrade gracefully with the current post count and keep card links resolvable", async ({ page, request }) => {
    await page.goto("/blog")
    const filterGroup = page.getByRole("group", { name: "Filter posts by category" })

    if ((await filterGroup.count()) === 0) {
      // Fewer than 2 distinct categories among published posts — the filter row is
      // intentionally hidden (see docs/DECISIONS.md #31). Nothing further to test here.
      return
    }

    const chips = filterGroup.getByRole("button")
    const chipCount = await chips.count()
    expect(chipCount, "expected an 'All' chip plus at least one category chip").toBeGreaterThanOrEqual(2)

    for (let index = 0; index < chipCount; index += 1) {
      await chips.nth(index).click()
      const hrefs = await page.locator("main a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")))
      const internalHrefs = [...new Set(hrefs.filter(isInternalPath).map((href) => href.split("?")[0].split("#")[0]).filter((href) => href !== ""))]
      await assertHrefsResolve(request, internalHrefs, `/blog with chip ${index} selected`)
    }
  })
})

// Sprint 42: related-posts block on blog detail pages is derived (category match, then shared
// linked-calculator) and renders nothing when there are 0 or 1 matches — with only 2 live posts
// today it currently renders nothing for either post. This asserts the contract either way: if
// the section is present, every link it renders must resolve.
test.describe("blog related posts", () => {
  const blogSlugs = ["understanding-loan-emi", "sip-vs-lumpsum"]

  for (const slug of blogSlugs) {
    test(`related posts links on /blog/${slug} resolve if the section renders`, async ({ page, request }) => {
      await page.goto(`/blog/${slug}`)
      const relatedSection = page.locator("section", { has: page.locator("#related-posts-heading") })

      if ((await relatedSection.count()) === 0) return

      const hrefs = await relatedSection.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")))
      const internalHrefs = [...new Set(hrefs.filter(isInternalPath))]
      expect(internalHrefs.length, "a rendered related-posts section should contain at least one link").toBeGreaterThan(0)
      await assertHrefsResolve(request, internalHrefs, `/blog/${slug} related posts`)
    })
  }
})
