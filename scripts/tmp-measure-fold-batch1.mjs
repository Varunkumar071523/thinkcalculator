import { chromium } from "@playwright/test"

// Sprint 48 batch 1 fold-line measurement: generalizes scripts/tmp-measure-fold.mjs (EMI-only) to
// the four calculators (FD, SIP, RD, Lumpsum) migrated to the same template this sprint. Same
// viewport sweep and same two measured edges (result-figure bottom, donut-heading top) as Sprint
// 47's EMI-only script, so before/after numbers are directly comparable in kind.
const BASE = process.env.FOLD_BASE_URL || "http://127.0.0.1:3110"
const WIDTHS = [1280, 390]
const HEIGHTS = [720, 768, 800, 900]

const CALCULATORS = [
  { name: "FD", path: "/finance/fd-calculator", labelPattern: /^Maturity amount/ },
  { name: "SIP", path: "/finance/sip-calculator", labelPattern: /^Estimated future value/ },
  { name: "RD", path: "/finance/rd-calculator", labelPattern: /^Maturity amount/ },
  { name: "Lumpsum", path: "/finance/lumpsum-calculator", labelPattern: /^Estimated future value/ },
]

async function main() {
  const browser = await chromium.launch()
  const results = []
  for (const calculator of CALCULATORS) {
    for (const width of WIDTHS) {
      for (const height of HEIGHTS) {
        const context = await browser.newContext({ viewport: { width, height } })
        const page = await context.newPage()
        await page.goto(BASE + calculator.path, { waitUntil: "load" })
        await page.waitForTimeout(300)

        const resultCard = page.getByTestId("calculator-result-card")
        const resultLabel = resultCard.getByText(calculator.labelPattern)
        const donutHeading = page.locator("#donut-title")

        const labelBox = await resultLabel.boundingBox()
        const donutBox = await donutHeading.boundingBox()

        results.push({
          calculator: calculator.name,
          width,
          height,
          resultLabelBottom: labelBox ? +(labelBox.y + labelBox.height).toFixed(1) : null,
          donutTop: donutBox ? +donutBox.y.toFixed(1) : null,
          donutFitsInViewport: donutBox ? donutBox.y + donutBox.height <= height : null,
        })
        await context.close()
      }
    }
  }
  await browser.close()
  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
