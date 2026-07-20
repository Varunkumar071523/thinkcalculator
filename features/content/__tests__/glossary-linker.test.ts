import { describe, expect, it } from "vitest"
import { createGlossaryMatcher, linkGlossaryTermsInText } from "@/features/content/glossary-linker"
import type { GlossaryTerm } from "@/types/glossary-content"

function makeTerm(slug: string, term: string): GlossaryTerm {
  return {
    id: `glossary-${slug}`,
    slug,
    term,
    shortDefinition: `${term} definition.`,
    canonicalPath: `/glossary/${slug}`,
    status: "published",
    sections: [],
    relatedCalculators: [],
    relatedContent: [],
    metadata: { title: term, description: `${term} definition.`, keywords: [] },
  }
}

const principal = makeTerm("principal", "Principal")
const interestRate = makeTerm("interest-rate", "Interest Rate")
const tenure = makeTerm("tenure", "Tenure")
const sip = makeTerm("sip", "SIP")
const stepUpSip = makeTerm("step-up-sip", "Step-up SIP")

const terms = [principal, interestRate, tenure, sip, stepUpSip]

function linkedSlugsAndTexts(text: string, matcher = createGlossaryMatcher(terms), linkedSlugs = new Set<string>()) {
  const segments = linkGlossaryTermsInText(text, matcher, linkedSlugs)
  return segments.filter((segment) => segment.type === "link").map((segment) => ({ text: segment.text, slug: segment.term.slug }))
}

describe("createGlossaryMatcher / linkGlossaryTermsInText", () => {
  it("links an exact whole-word match", () => {
    const linked = linkedSlugsAndTexts("The principal is repaid over time.")
    expect(linked).toEqual([{ text: "principal", slug: "principal" }])
  })

  it("does not double-match a shorter term inside a longer term (word-boundary + longest-first)", () => {
    const linked = linkedSlugsAndTexts("A Step-up SIP increases its contribution every year.")
    expect(linked).toEqual([{ text: "Step-up SIP", slug: "step-up-sip" }])
  })

  it("does not link a term found only as part of another word", () => {
    const linked = linkedSlugsAndTexts("The principality is unrelated to the loan principal itself.")
    expect(linked).toEqual([{ text: "principal", slug: "principal" }])
  })

  it("rejects a partial match of a multi-word term (e.g. 'rate' inside 'interest rate' is not a separate match)", () => {
    const rateOnly = makeTerm("rate", "Rate")
    const matcher = createGlossaryMatcher([interestRate, rateOnly])
    const linked = linkedSlugsAndTexts("The monthly interest rate applies to the outstanding balance.", matcher)
    expect(linked).toEqual([{ text: "interest rate", slug: "interest-rate" }])
  })

  it("links only the first occurrence of a repeated term within one text", () => {
    const linked = linkedSlugsAndTexts("The tenure is fixed. A longer tenure can change the total tenure paid.")
    expect(linked).toEqual([{ text: "tenure", slug: "tenure" }])
  })

  it("links only the first occurrence of a term across multiple texts sharing one linkedSlugs set", () => {
    const matcher = createGlossaryMatcher(terms)
    const linkedSlugs = new Set<string>()
    const first = linkedSlugsAndTexts("SIP contributions are regular.", matcher, linkedSlugs)
    const second = linkedSlugsAndTexts("A SIP can also be stepped up annually.", matcher, linkedSlugs)
    expect(first).toEqual([{ text: "SIP", slug: "sip" }])
    expect(second).toEqual([])
  })

  it("is case-insensitive but preserves the original casing of the matched text", () => {
    const linked = linkedSlugsAndTexts("the PRINCIPAL amount is the base for interest.")
    expect(linked).toEqual([{ text: "PRINCIPAL", slug: "principal" }])
  })

  it("returns plain text segments when there is no match", () => {
    const matcher = createGlossaryMatcher(terms)
    const segments = linkGlossaryTermsInText("Nothing here matches any glossary term.", matcher, new Set())
    expect(segments).toEqual([{ type: "text", text: "Nothing here matches any glossary term." }])
  })
})
