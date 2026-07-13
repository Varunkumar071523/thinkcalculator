import { describe, expect, it } from "vitest"

import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import {
  CLUSTER_RELATED_LINK_LIMIT,
  contentRegistry,
  createEditorialSearchDocuments,
  getPublicClusterMemberships,
  getPublicTopics,
  getTopicLearningPath,
  glossaryRegistry,
  isSubstantiveTopic,
  resolveClusterNavigation,
  resolveTopic,
  topicRegistry,
} from "@/features/content"
import { createCanonicalUrl } from "@/lib/seo"
import { calculatorSearchPath } from "@/lib/site-config"

const publicTopics = getPublicTopics()
const publicMembers = publicTopics.flatMap((topic) => [...topic.calculators, ...topic.blogs, ...topic.guides, ...topic.glossaryTerms])
const liveResources = [...calculatorRegistry, ...contentRegistry, ...glossaryRegistry].filter((item) => item.status === "published")
const livePaths = new Set([...liveResources.map((item) => item.canonicalPath), ...publicTopics.map(({ definition }) => definition.canonicalPath)])

describe("focused content clusters", () => {
  it("uses eligible topic hubs as the canonical public cluster definitions", () => {
    expect(publicTopics.map(({ definition }) => definition.id).toSorted()).toEqual(["topic-investing", "topic-loans"])
    expect(topicRegistry.filter((item) => item.status === "published").length).toBeGreaterThan(publicTopics.length)
  })

  it("produces cluster navigation only from public eligible topics", () => {
    expect(resolveClusterNavigation("emi-calculator")?.topics.map((item) => item.id)).toEqual(["topic-loans"])
    expect(resolveClusterNavigation("fd-calculator")).toBeUndefined()
    expect(resolveClusterNavigation("framework-demo")).toBeUndefined()
  })

  it("resolves every Loans member back to its live topic hub", () => {
    const loans = publicTopics.find(({ definition }) => definition.slug === "loans")!
    for (const member of [...loans.calculators, ...loans.blogs, ...loans.guides, ...loans.glossaryTerms]) {
      expect(resolveClusterNavigation(member.id)?.topics.map((item) => item.canonicalPath)).toContain(loans.definition.canonicalPath)
    }
  })

  it("resolves every Investing member back to its live topic hub", () => {
    const investing = publicTopics.find(({ definition }) => definition.slug === "investing")!
    for (const member of [...investing.calculators, ...investing.blogs, ...investing.guides, ...investing.glossaryTerms]) {
      expect(resolveClusterNavigation(member.id)?.topics.map((item) => item.canonicalPath)).toContain(investing.definition.canonicalPath)
    }
  })

  it("excludes draft editorial, draft glossary, and unpublished calculators", () => {
    for (const id of ["draft-fd-vs-rd", "glossary-maturity-value", "framework-demo"]) expect(resolveClusterNavigation(id)).toBeUndefined()
    const serialized = JSON.stringify(publicMembers)
    expect(serialized).not.toContain("choosing-between-fd-and-rd")
    expect(serialized).not.toContain("maturity-value")
    expect(serialized).not.toContain("framework-demo")
  })

  it("excludes draft, sparse, and unresolved topic definitions", () => {
    expect(getPublicClusterMemberships("fd-calculator")).toEqual([])
    expect(getPublicClusterMemberships("emi-calculator").map(({ definition }) => definition.slug)).not.toContain("borrowing-basics")
    const invalid = { ...topicRegistry[0], calculatorIds: [...topicRegistry[0].calculatorIds, "missing-calculator"] }
    expect(resolveTopic(invalid).unresolvedReferences).toContain("missing-calculator")
  })

  it("does not create false memberships for resources outside eligible topics", () => {
    for (const id of ["fd-calculator", "rd-calculator", "framework-demo", "draft-fd-vs-rd", "glossary-maturity-value"]) expect(getPublicClusterMemberships(id)).toEqual([])
  })

  it("removes current-page links and deduplicates canonical destinations", () => {
    const navigation = resolveClusterNavigation("blog-understanding-loan-emi", [
      { href: "/blog/understanding-loan-emi" },
      { href: "/finance/emi-calculator" },
      { href: "/finance/emi-calculator" },
    ])!
    const paths = [...navigation.topics, ...navigation.related].map((item) => item.canonicalPath)
    expect(paths).not.toContain("/blog/understanding-loan-emi")
    expect(new Set(paths).size).toBe(paths.length)
  })

  it("uses only canonical live paths", () => {
    expect(new Set(liveResources.map((item) => item.id)).size).toBe(liveResources.length)
    expect(new Set(liveResources.map((item) => item.canonicalPath)).size).toBe(liveResources.length)
    for (const member of publicMembers) {
      const navigation = resolveClusterNavigation(member.id)!
      for (const link of [...navigation.topics, ...navigation.related]) {
        expect(livePaths.has(link.canonicalPath)).toBe(true)
        expect(link.canonicalPath).not.toContain("?")
      }
    }
  })

  it("preserves authored relationship precedence before filling topic gaps", () => {
    const navigation = resolveClusterNavigation("blog-sip-vs-lumpsum", [
      { href: "/blog/choosing-between-fd-and-rd" },
      { href: "/guides/how-to-estimate-sip-growth" },
      { href: "/finance/lumpsum-calculator" },
    ])!
    expect(navigation.related.slice(0, 2).map((item) => [item.canonicalPath, item.source])).toEqual([
      ["/guides/how-to-estimate-sip-growth", "authored"],
      ["/finance/lumpsum-calculator", "authored"],
    ])
    expect(navigation.related.some((item) => item.type === "glossary" && item.source === "topic")).toBe(true)
    expect(navigation.related.some((item) => item.canonicalPath === "/blog/choosing-between-fd-and-rd")).toBe(false)
  })

  it("fills useful missing resource types without linking to the current type", () => {
    const navigation = resolveClusterNavigation("emi-calculator")!
    expect(new Set(navigation.related.map((item) => item.type))).toEqual(new Set(["blog", "guide", "glossary"]))
    expect(navigation.related.some((item) => item.type === "calculator")).toBe(false)
    expect(navigation.related.filter((item) => item.type === "glossary").map((item) => item.id)).toEqual(["glossary-emi", "glossary-principal"])
  })

  it("keeps memberships deterministic and respects curated topic order within each resource type", () => {
    const navigation = resolveClusterNavigation("glossary-principal")!
    expect(navigation.topics.map((item) => item.title)).toEqual(["Investing", "Loans"])
    expect(resolveClusterNavigation("glossary-principal")).toEqual(navigation)
    expect(resolveClusterNavigation("sip-calculator")!.related.filter((item) => item.type === "glossary").map((item) => item.id)).toEqual(["glossary-sip", "glossary-compounding"])
  })

  it("keeps related collections within the documented limit", () => {
    for (const member of publicMembers) expect(resolveClusterNavigation(member.id)!.related.length).toBeLessThanOrEqual(CLUSTER_RELATED_LINK_LIMIT)
  })

  it("returns no relationship section when no public membership exists", () => {
    expect(resolveClusterNavigation("not-a-resource")).toBeUndefined()
    expect(resolveClusterNavigation("fd-calculator")).toBeUndefined()
  })

  it("builds live, unique, intentional learning paths", () => {
    for (const topic of publicTopics) {
      const path = getTopicLearningPath(topic)
      expect(path).toHaveLength(topic.definition.startHere.length)
      expect(new Set(path.map((step) => step.destination.canonicalPath)).size).toBe(path.length)
      path.forEach((step) => expect(livePaths.has(step.destination.canonicalPath)).toBe(true))
      expect(path.map((step) => step.destination.type)).toEqual(["blog", "glossary", "guide", "calculator"])
    }
  })

  it("rejects broken or duplicate learning-path relationships", () => {
    const missing = { ...topicRegistry[0], startHere: [{ ...topicRegistry[0].startHere[0], resourceId: "missing-resource" }, ...topicRegistry[0].startHere.slice(1)] }
    const duplicate = { ...topicRegistry[0], startHere: topicRegistry[0].startHere.map((step) => ({ ...step, resourceId: topicRegistry[0].startHere[0].resourceId })) }
    expect(resolveTopic(missing).unresolvedReferences).toContain("missing-resource")
    expect(isSubstantiveTopic(missing)).toBe(false)
    expect(isSubstantiveTopic(duplicate)).toBe(false)
    expect(() => getTopicLearningPath(resolveTopic(missing))).toThrow(/invalid learning-path resource/)
  })

  it("does not change sitemap or search scopes", () => {
    const urls = sitemap().map((item) => item.url)
    expect(urls.filter((url) => url === createCanonicalUrl("/topics/loans"))).toHaveLength(1)
    expect(urls.filter((url) => url === createCanonicalUrl("/topics/investing"))).toHaveLength(1)
    expect(urls).not.toContain(createCanonicalUrl("/topics/savings"))
    expect(createEditorialSearchDocuments().some((item) => item.canonicalPath.startsWith("/finance/"))).toBe(false)
    expect(calculatorSearchPath).toBe("/calculators")
  })
})
