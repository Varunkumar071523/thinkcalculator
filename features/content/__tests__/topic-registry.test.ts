import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { contentRegistry, getPublicTopicBySlug, getPublicTopics, getTopicStaticParams, glossaryRegistry, isSubstantiveTopic, resolveTopic, topicRegistry } from "@/features/content"
import { createCanonicalUrl } from "@/lib/seo"

describe("topic registry", () => {
  const publicTopics = getPublicTopics()
  const publicDefinitions = publicTopics.map((topic) => topic.definition)

  it("uses unique IDs, slugs, canonical paths, and metadata titles", () => {
    for (const values of [topicRegistry.map((item) => item.id), topicRegistry.map((item) => item.slug), topicRegistry.map((item) => item.canonicalPath), topicRegistry.map((item) => item.metadata.title)]) expect(new Set(values).size).toBe(values.length)
  })

  it("publishes only substantive definitions", () => {
    expect(new Set(publicDefinitions.map((item) => item.slug))).toEqual(new Set(["loans", "investing"]))
    expect(publicDefinitions.every((item) => item.status === "published" && isSubstantiveTopic(item))).toBe(true)
  })

  it("excludes draft and sparse topics", () => {
    expect(isSubstantiveTopic(topicRegistry.find((item) => item.slug === "savings")!)).toBe(false)
    expect(getPublicTopicBySlug("savings")).toBeUndefined()
    expect(getPublicTopicBySlug("borrowing-basics")).toBeUndefined()
  })

  it("resolves every calculator reference to a published calculator", () => {
    const publishedIds = new Set(calculatorRegistry.filter((item) => item.status === "published").map((item) => item.id))
    topicRegistry.forEach((definition) => { const topic = resolveTopic(definition); topic.calculators.forEach((item) => expect(publishedIds.has(item.id)).toBe(true)); expect(topic.unresolvedReferences).toEqual([]); expect(topic.calculators).toHaveLength(definition.calculatorIds.length) })
  })

  it("resolves every editorial reference and keeps it published", () => {
    const publishedIds = new Set(contentRegistry.filter((item) => item.status === "published").map((item) => item.id))
    topicRegistry.forEach((definition) => { const topic = resolveTopic(definition); [...topic.blogs, ...topic.guides].forEach((item) => expect(publishedIds.has(item.id)).toBe(true)); expect(topic.blogs.length + topic.guides.length).toBe(definition.editorialIds.length) })
  })

  it("resolves every glossary reference and keeps it published", () => {
    const publishedIds = new Set(glossaryRegistry.filter((item) => item.status === "published").map((item) => item.id))
    topicRegistry.forEach((definition) => { const topic = resolveTopic(definition); topic.glossaryTerms.forEach((item) => expect(publishedIds.has(item.id)).toBe(true)); expect(topic.glossaryTerms).toHaveLength(definition.glossaryIds.length) })
  })

  it("generates static params only for public topics without relying on registry order", () => { expect(new Set(getTopicStaticParams().map((item) => item.slug))).toEqual(new Set(publicDefinitions.map((item) => item.slug))) })
  it("does not allow invalid, draft, or sparse lookups to become public", () => { expect(getPublicTopicBySlug("not-a-topic")).toBeUndefined(); expect(getPublicTopicBySlug("borrowing-basics")).toBeUndefined(); expect(getPublicTopicBySlug("savings")).toBeUndefined() })

  it("includes the index and all public hubs in the sitemap", () => {
    const urls = sitemap().map((item) => item.url)
    for (const path of ["/topics", ...publicDefinitions.map((topic) => topic.canonicalPath)]) expect(urls.filter((url) => url === createCanonicalUrl(path))).toHaveLength(1)
  })

  it("excludes draft and sparse hubs from the sitemap", () => { const urls = new Set(sitemap().map((item) => item.url)); expect(urls.has(createCanonicalUrl("/topics/savings"))).toBe(false); expect(urls.has(createCanonicalUrl("/topics/borrowing-basics"))).toBe(false) })

  it("requires every public resource section to contain items", () => { publicTopics.forEach((topic) => { expect(topic.calculators.length).toBeGreaterThan(0); expect(topic.blogs.length).toBeGreaterThan(0); expect(topic.guides.length).toBeGreaterThan(0); expect(topic.glossaryTerms.length).toBeGreaterThan(0) }) })

  it("uses live canonical routes for generated links", () => {
    const livePaths = new Set([...calculatorRegistry, ...contentRegistry, ...glossaryRegistry].filter((item) => item.status === "published").map((item) => item.canonicalPath))
    publicTopics.flatMap((topic) => [...topic.calculators, ...topic.blogs, ...topic.guides, ...topic.glossaryTerms]).forEach((item) => expect(livePaths.has(item.canonicalPath)).toBe(true))
  })

  it("has unique, non-empty public metadata", () => { const titles = publicDefinitions.map((item) => item.metadata.title); const descriptions = publicDefinitions.map((item) => item.metadata.description); expect(new Set(titles).size).toBe(titles.length); expect(new Set(descriptions).size).toBe(descriptions.length); [...titles, ...descriptions].forEach((value) => expect(value.trim()).not.toBe("") ) })

  it("detects unresolved references instead of silently dropping them", () => {
    const invalidDefinitions = [
      { ...topicRegistry[0], calculatorIds: [...topicRegistry[0].calculatorIds, "missing-calculator"] },
      { ...topicRegistry[0], editorialIds: [...topicRegistry[0].editorialIds, "missing-editorial"] },
      { ...topicRegistry[0], glossaryIds: [...topicRegistry[0].glossaryIds, "missing-glossary"] },
    ]
    invalidDefinitions.forEach((definition) => { expect(resolveTopic(definition).unresolvedReferences).toHaveLength(1); expect(isSubstantiveTopic(definition)).toBe(false) })
  })

  it("rejects draft calculator, editorial, and glossary relationships", () => {
    const draftDefinitions = [
      { ...topicRegistry[0], calculatorIds: ["framework-demo"] },
      { ...topicRegistry[0], editorialIds: ["draft-fd-vs-rd", "guide-use-emi"] },
      { ...topicRegistry[0], glossaryIds: ["glossary-maturity-value"] },
    ]
    draftDefinitions.forEach((definition) => expect(isSubstantiveTopic(definition)).toBe(false))
  })
})
