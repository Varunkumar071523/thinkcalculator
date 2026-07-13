import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { EditorialSection } from "@/components/editorial/editorial-section"
import { GlossaryStructuredData } from "@/components/glossary/glossary-structured-data"
import { SiteContainer } from "@/components/layout/site-container"
import { getGlossaryStaticParams, getGlossaryTermBySlug } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"

type Props = { params: Promise<{ slug: string }> }
export const dynamicParams = false
export function generateStaticParams() { return getGlossaryStaticParams() }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const item = getGlossaryTermBySlug((await params).slug); return item && item.status === "published" ? createPageMetadata({ title: item.metadata.title, description: item.metadata.description, path: item.canonicalPath, keywords: item.metadata.keywords }) : {} }

export default async function GlossaryTermPage({ params }: Props) {
  const item = getGlossaryTermBySlug((await params).slug); if (!item || item.status !== "published") notFound()
  const links = [...item.relatedCalculators, ...item.relatedContent]
  return <><GlossaryStructuredData item={item} /><SiteContainer className="py-10 sm:py-14"><nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li><Link href="/glossary">Glossary</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">{item.term}</li></ol></nav><main className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]"><article><header><p className="text-sm font-semibold uppercase tracking-wider text-primary">Financial glossary</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{item.term}</h1><p className="mt-5 text-xl leading-8 text-muted-foreground">{item.shortDefinition}</p></header><div className="mt-10 space-y-10">{item.sections.map((section) => <EditorialSection key={section.id} section={section} />)}</div></article><aside className="h-fit rounded-xl border bg-muted/30 p-5"><h2 className="font-semibold">Related resources</h2><ul className="mt-4 space-y-4">{links.map((link) => <li key={link.href}><Link href={link.href} className="font-medium text-primary hover:underline">{link.title}</Link><p className="mt-1 text-sm leading-5 text-muted-foreground">{link.description}</p></li>)}</ul></aside></main></SiteContainer></>
}
