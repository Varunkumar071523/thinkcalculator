import { chromium } from "@playwright/test"
import { writeFileSync } from "node:fs"

const BASE = "http://127.0.0.1:3104"
const WIDTHS = [320, 375, 414]
const HEIGHT = 812

const pages = [
  { name: "home", path: "/", hasForm: false },
  { name: "emi", path: "/finance/emi-calculator", hasForm: true },
  { name: "sip", path: "/finance/sip-calculator", hasForm: true },
  { name: "lumpsum", path: "/finance/lumpsum-calculator", hasForm: true },
  { name: "fd", path: "/finance/fd-calculator", hasForm: true },
  { name: "rd", path: "/finance/rd-calculator", hasForm: true },
  { name: "cagr", path: "/finance/cagr-calculator", hasForm: true },
  { name: "ppf", path: "/finance/ppf-calculator", hasForm: true },
  { name: "gst", path: "/business/gst-calculator", hasForm: true },
  { name: "gratuity", path: "/finance/gratuity-calculator", hasForm: true },
  { name: "hra", path: "/finance/hra-calculator", hasForm: true },
  { name: "income-tax", path: "/finance/income-tax-calculator", hasForm: true },
  { name: "step-up-sip", path: "/finance/step-up-sip-calculator", hasForm: true },
  { name: "swp", path: "/finance/swp-calculator", hasForm: true },
  { name: "inflation", path: "/finance/inflation-calculator", hasForm: true },
  { name: "retirement-corpus", path: "/finance/retirement-corpus-calculator", hasForm: true },
]

async function hasPageLevelHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
}

async function offendingOverflowElements(page) {
  return page.evaluate((vw) => {
    const els = Array.from(document.querySelectorAll("body *"))
    const offenders = []
    for (const el of els) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      if (rect.right > vw + 2) {
        const style = getComputedStyle(el)
        if (style.position === "fixed" || style.position === "absolute") continue
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === "string") ? el.className.slice(0, 80) : "",
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        })
      }
    }
    return offenders.slice(0, 10)
  }, await page.evaluate(() => window.innerWidth))
}

async function tapTargetIssues(page) {
  return page.evaluate(() => {
    const MIN = 44
    const selector = "button, a[href], input, select, [role=button], [role=radio], label:has(input)"
    const els = Array.from(document.querySelectorAll(selector))
    const issues = []
    for (const el of els) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      const style = getComputedStyle(el)
      if (style.visibility === "hidden" || style.display === "none") continue
      if (rect.height < MIN || rect.width < MIN) {
        issues.push({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute("role") || "",
          type: el.getAttribute("type") || "",
          text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "").trim().slice(0, 40),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        })
      }
    }
    // de-dupe by tag+role+type+approx size, keep counts
    const map = new Map()
    for (const i of issues) {
      const key = `${i.tag}|${i.role}|${i.type}|${i.w}x${i.h}`
      if (!map.has(key)) map.set(key, { ...i, count: 0 })
      map.get(key).count++
    }
    return Array.from(map.values())
  })
}

async function truncationIssues(page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("h1, h2, h3, button, a, label, td, th, p, span"))
    const issues = []
    for (const el of els) {
      if (el.children.length > 2) continue
      const style = getComputedStyle(el)
      if (style.overflow === "hidden" && style.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 2) {
        issues.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || "").trim().slice(0, 60) })
      }
      // wrapping check: whitespace-nowrap element wider than its container forces scroll/clip
      if (style.whiteSpace === "nowrap" && el.scrollWidth > el.clientWidth + 2 && style.overflow !== "auto" && style.overflow !== "scroll") {
        issues.push({ tag: el.tagName.toLowerCase(), text: (el.textContent || "").trim().slice(0, 60), kind: "nowrap-clipped" })
      }
    }
    return issues.slice(0, 15)
  })
}

async function auditPage(browser, pageInfo, width) {
  const context = await browser.newContext({ viewport: { width, height: HEIGHT } })
  const page = await context.newPage()
  const result = { page: pageInfo.name, path: pageInfo.path, width, pre: {}, post: {} }

  await page.goto(BASE + pageInfo.path, { waitUntil: "load" })
  await page.waitForTimeout(300)

  result.pre.horizontalScroll = await hasPageLevelHorizontalScroll(page)
  result.pre.overflowElements = await offendingOverflowElements(page)
  result.pre.tapTargetIssues = pageInfo.hasForm ? await tapTargetIssues(page) : []
  result.pre.truncation = await truncationIssues(page)

  if (pageInfo.hasForm) {
    try {
      await page.locator("form button[type=submit]").first().click({ timeout: 5000 })
      await page.waitForTimeout(400)

      const expandButtons = page.getByRole("button", { name: /show full schedule/i })
      let guard = 0
      while ((await expandButtons.count()) && guard < 5) {
        await expandButtons.first().click()
        guard++
      }
      await page.waitForTimeout(300)

      result.post.horizontalScroll = await hasPageLevelHorizontalScroll(page)
      result.post.overflowElements = await offendingOverflowElements(page)
      result.post.tapTargetIssues = await tapTargetIssues(page)
      result.post.truncation = await truncationIssues(page)
    } catch (err) {
      result.post.error = String(err).slice(0, 200)
    }
  }

  await context.close()
  return result
}

async function main() {
  const browser = await chromium.launch()
  const allResults = []
  for (const pageInfo of pages) {
    for (const width of WIDTHS) {
      process.stderr.write(`auditing ${pageInfo.name} @ ${width}px\n`)
      const r = await auditPage(browser, pageInfo, width)
      allResults.push(r)
    }
  }
  await browser.close()
  writeFileSync(process.argv[2] || "./viewport-audit-results.json", JSON.stringify(allResults, null, 2))
  process.stderr.write("DONE\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
