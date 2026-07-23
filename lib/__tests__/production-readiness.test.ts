import { describe, expect, it } from "vitest"

import manifest from "@/app/manifest"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { calculatorRegistry, demoCalculatorDefinition } from "@/features/calculators/core/calculator-registry"
import { securityHeaders } from "@/lib/production-config"
import { createCalculatorMetadata, createCanonicalUrl } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

describe("production readiness configuration", () => {
  it("provides a factual web manifest without offline claims", () => {
    const output = manifest()
    expect(output).toMatchObject({ name: "ThinkCalculator", short_name: "ThinkCalculator", start_url: "/", display: "standalone", lang: "en-IN" })
    expect(output.icons).toEqual(expect.arrayContaining([expect.objectContaining({ src: "/icon", type: "image/png" })]))
    expect(JSON.stringify(output).toLowerCase()).not.toContain("offline")
  })

  it("uses an HTTPS production URL and unique security header keys", () => {
    expect(siteConfig.url).toMatch(/^https:\/\//)
    const keys = securityHeaders.map((header) => header.key.toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual(expect.arrayContaining(["x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options", "strict-transport-security"]))
  })

  it("lists every published calculator but excludes the demo from the sitemap", () => {
    const urls = new Set(sitemap().map((entry) => entry.url))
    const published = calculatorRegistry.filter((calculator) => calculator.status === "published")
    expect(published).toHaveLength(20)
    for (const calculator of published) expect(urls.has(createCanonicalUrl(calculator.canonicalPath))).toBe(true)
    expect(urls.has(createCanonicalUrl(demoCalculatorDefinition.canonicalPath))).toBe(false)
  })

  it("allows crawling and points robots to the production sitemap", () => {
    expect(robots()).toMatchObject({ sitemap: createCanonicalUrl("/sitemap.xml"), host: new URL(siteConfig.url).host, rules: { userAgent: "*", allow: "/" } })
  })

  it("keeps published calculators indexable and the demo noindex", () => {
    for (const calculator of calculatorRegistry) {
      const metadata = createCalculatorMetadata(calculator)
      expect(metadata.alternates?.canonical).toBe(createCanonicalUrl(calculator.canonicalPath))
      expect(metadata.robots).toMatchObject({ index: calculator.status === "published", follow: true })
    }
  })
})
