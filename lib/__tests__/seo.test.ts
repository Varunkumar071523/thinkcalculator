import { describe, expect, it } from "vitest"

import { createCanonicalUrl, createRootStructuredData } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

type OrganizationNode = { name: string; url: string; logo: { "@type": string; url: string; width: number; height: number } }

describe("createCanonicalUrl", () => {
  it("appends a trailing slash to ordinary paths", () => {
    expect(createCanonicalUrl("/finance/emi-calculator")).toBe(`${siteConfig.url}/finance/emi-calculator/`)
  })

  it("keeps the root path as exactly '/' with no double slash", () => {
    expect(createCanonicalUrl("/")).toBe(`${siteConfig.url}/`)
    expect(createCanonicalUrl()).toBe(`${siteConfig.url}/`)
  })

  it("does not double up a trailing slash that is already present", () => {
    expect(createCanonicalUrl("/finance/")).toBe(`${siteConfig.url}/finance/`)
  })

  it("does not add a trailing slash to static file paths", () => {
    expect(createCanonicalUrl("/sitemap.xml")).toBe(`${siteConfig.url}/sitemap.xml`)
  })

  it("adds the trailing slash before query strings and hash fragments", () => {
    expect(createCanonicalUrl("/search?q=emi")).toBe(`${siteConfig.url}/search/?q=emi`)
    expect(createCanonicalUrl("/glossary/cagr#formula")).toBe(`${siteConfig.url}/glossary/cagr/#formula`)
  })
})

describe("createRootStructuredData", () => {
  const graph = createRootStructuredData()["@graph"]
  const organization = graph.find((node) => node["@type"] === "Organization") as OrganizationNode | undefined

  it("includes an Organization node with name, url, and logo", () => {
    expect(organization).toMatchObject({
      name: siteConfig.name,
      url: siteConfig.url,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/icon` },
    })
  })

  it("points the logo at a real icon route, not a placeholder", () => {
    expect(organization?.logo.url).toBe(`${siteConfig.url}/icon`)
    expect(organization?.logo.width).toBeGreaterThan(0)
    expect(organization?.logo.height).toBeGreaterThan(0)
  })
})
