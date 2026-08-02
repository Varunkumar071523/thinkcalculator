import { chromium } from "@playwright/test"

// Sprint 49 batch 2 fold-line measurement: generalizes scripts/tmp-measure-fold-batch1.mjs to the
// four calculators (Step-up SIP, NPS, PPF, Home Loan Eligibility) migrated to the same template this
// sprint. Same viewport sweep and same two measured edges (result-figure label bottom, donut-heading
// top) as Sprint 48 batch 1's script, so before/after numbers are directly comparable in kind.
const BASE = process.env.FOLD_BASE_URL || "http://127.0.0.1:3110"
const WIDTHS = [1280, 390]
const HEIGHTS = [720, 768, 800, 900]

const CALCULATORS = [
  { name: "Step-up SIP", path: "/finance/step-up-sip-calculator", labelPattern: /^Estimated maturity value/ },
  { name: "NPS", path: "/finance/nps-calculator", labelPattern: /^Estimated corpus at retirement/ },
  { name: "PPF", path: "/finance/ppf-calculator", labelPattern: /^Estimated maturity value/ },
  { name: "Home Loan Eligibility", path: "/finance/home-loan-eligibility-calculator", labelPattern: /^Max eligible EMI/ },
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
