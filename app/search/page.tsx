import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ChevronRight } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { ResourceSearch } from "@/components/search/resource-search"
import { ResourceSearchFallback } from "@/components/search/resource-search-fallback"
import { createEditorialSearchDocuments } from "@/features/content/editorial-search"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Search Financial Learning Resources",
  description: "Search ThinkCalculator's published financial blogs, guides, glossary terms, and public learning topics.",
  path: "/search",
})

const searchDocuments = createEditorialSearchDocuments()

export default function SearchPage() {
  return (
    <SiteContainer className="py-10 sm:py-14">
      <nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden="true"><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Search resources</li></ol></nav>
      <header className="mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Learning resource discovery</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Search financial learning resources</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Find published explanations, practical guides, plain-language definitions, and topic learning paths. To find a calculation tool, use the calculator search instead.</p>
        <Link href="/calculators" className="mt-4 inline-block rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Search calculators</Link>
      </header>
      <Suspense fallback={<ResourceSearchFallback />}>
        <ResourceSearch documents={searchDocuments} />
      </Suspense>
    </SiteContainer>
  )
}
