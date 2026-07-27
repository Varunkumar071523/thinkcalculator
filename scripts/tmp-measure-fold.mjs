import { chromium } from "@playwright/test"

const BASE = process.env.FOLD_BASE_URL || "http://127.0.0.1:3110"
const WIDTHS = [1280, 390]
const HEIGHTS = [720, 768, 800, 900]

async function main() {
  const browser = await chromium.launch()
  const results = []
  for (const width of WIDTHS) {
    for (const height of HEIGHTS) {
      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage()
      await page.goto(BASE + "/finance/emi-calculator", { waitUntil: "load" })
      await page.waitForTimeout(300)

      const resultCard = page.getByTestId("calculator-result-card")
      const monthlyEmi = resultCard.getByText(/^Monthly EMI/)
      const donutHeading = page.locator("#donut-title")

      const emiBox = await monthlyEmi.boundingBox()
      const donutBox = await donutHeading.boundingBox()

      results.push({
        width,
        height,
        emiBottom: emiBox ? +(emiBox.y + emiBox.height).toFixed(1) : null,
        donutTop: donutBox ? +donutBox.y.toFixed(1) : null,
      })
      await context.close()
    }
  }
  await browser.close()
  console.log(JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
