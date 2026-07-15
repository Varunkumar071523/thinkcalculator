import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SiteContainer } from "@/components/layout/site-container"
import { getPublishedGlossaryTerms } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({ title: "Financial Glossary", description: "Understand common loan, investment, savings, and calculator terms with plain-language definitions and examples.", path: "/glossary" })

export default function GlossaryPage() {
  const items = getPublishedGlossaryTerms().toSorted((a, b) => a.term.localeCompare(b.term))
  return <SiteContainer className="py-10 sm:py-14"><nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Glossary</li></ol></nav><header className="mt-8 max-w-3xl"><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Financial Glossary</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Plain-language explanations of terms used across ThinkCalculator&apos;s finance calculators and learning resources.</p></header><dl className="mt-10 grid gap-4 sm:grid-cols-2">{items.map((item) => <div key={item.id} className="rounded-xl border bg-card p-5"><dt><Link href={item.canonicalPath} className="text-xl font-semibold hover:text-primary">{item.term}</Link></dt><dd className="mt-2 leading-7 text-muted-foreground">{item.shortDefinition}</dd><dd><Link href={item.canonicalPath} className="mt-4 inline-block text-sm font-medium text-primary">Read definition<span className="sr-only"> of {item.term}</span></Link></dd></div>)}</dl></SiteContainer>
}
