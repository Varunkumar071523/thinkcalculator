import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { getPublishedGlossaryTerms } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({ title: "Financial Glossary", description: "Understand common loan, investment, savings, and calculator terms with plain-language definitions and examples.", path: "/glossary" })

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export default function GlossaryPage() {
  const items = getPublishedGlossaryTerms().toSorted((a, b) => a.term.localeCompare(b.term))
  const letterGroups = new Map<string, typeof items>()
  for (const item of items) {
    const letter = item.term.charAt(0).toUpperCase()
    letterGroups.set(letter, [...(letterGroups.get(letter) ?? []), item])
  }
  const availableLetters = new Set(letterGroups.keys())

  return (
    <SiteContainer className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Glossary</li></ol></nav>
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Glossary</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Financial terms, explained simply</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">Quick reference for language used across ThinkCalculator&apos;s tools.</p>
      </header>

      <nav aria-label="Jump to letter" className="sticky top-16 z-10 mt-6 flex flex-wrap gap-1 border-y border-line bg-background py-3.5">
        {ALPHABET.map((letter) =>
          availableLetters.has(letter) ? (
            <a key={letter} href={`#letter-${letter}`} className="flex size-[26px] items-center justify-center rounded-md text-[12.5px] font-semibold text-muted-foreground hover:bg-money hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{letter}</a>
          ) : (
            <span key={letter} aria-hidden="true" className="flex size-[26px] items-center justify-center text-[12.5px] font-semibold text-line">{letter}</span>
          ),
        )}
      </nav>

      <div className="mt-8">
        {[...letterGroups.entries()].map(([letter, terms]) => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-32 border-b border-line pb-7 pt-7 first:pt-0">
            <h2 className="mb-3.5 border-b-2 border-money-soft pb-1.5 font-serif text-[22px] font-semibold text-money">{letter}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {terms.map((term) => (
                <div key={term.id} className="rounded-[10px] border border-line bg-card p-4">
                  <h3 className="text-[15px] font-semibold"><Link href={term.canonicalPath} className="hover:text-money">{term.term}</Link></h3>
                  <p className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">{term.shortDefinition}</p>
                  {term.relatedCalculators.length > 0 ? (
                    <p className="mt-2 text-[11.5px] font-semibold text-money">Used in: {term.relatedCalculators.map((calculator) => calculator.title).join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SiteContainer>
  )
}
