import { describe, expect, it } from "vitest"

import { createRootStructuredData } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"

type OrganizationNode = { name: string; url: string; logo: { "@type": string; url: string; width: number; height: number } }

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
