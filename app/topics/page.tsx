import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { SiteContainer } from "@/components/layout/site-container"
import { TopicBreadcrumbStructuredData } from "@/components/topics/topic-breadcrumb-structured-data"
import { getPublicTopics } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({ title: "Financial Learning Topics", description: "Explore substantive learning hubs that connect ThinkCalculator calculators, articles, guides, and glossary definitions by topic.", path: "/topics" })

export default function TopicsPage() {
  const topics = getPublicTopics()
  return <><TopicBreadcrumbStructuredData /><SiteContainer className="py-10 sm:py-14"><nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Topics</li></ol></nav><header className="mt-8 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Learning hubs</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Explore financial topics</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Move from a concept to a calculation with focused collections of live tools, explanations, practical guides, and plain-language definitions.</p></header><section className="mt-12" aria-labelledby="published-topics"><h2 id="published-topics" className="text-2xl font-semibold tracking-tight">Published topic hubs</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{topics.map(({ definition, calculators, blogs, guides, glossaryTerms }) => <article key={definition.id} className="rounded-xl border bg-card p-6"><h3 className="text-2xl font-semibold"><Link href={definition.canonicalPath} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{definition.name}</Link></h3><p className="mt-3 leading-7 text-muted-foreground">{definition.description}</p><p className="mt-4 text-sm text-muted-foreground">{calculators.length} {calculators.length === 1 ? "calculator" : "calculators"} · {blogs.length + guides.length} learning resources · {glossaryTerms.length} glossary terms</p><Link href={definition.canonicalPath} className="mt-5 inline-flex items-center gap-2 rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Explore {definition.name}<ArrowRight className="size-4" aria-hidden /></Link></article>)}</div></section></SiteContainer></>
}
