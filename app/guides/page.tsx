import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SiteContainer } from "@/components/layout/site-container"
import { EditorialListing } from "@/components/editorial/editorial-listing"
import { getContentByType } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"
export const metadata: Metadata = createPageMetadata({ title: "Financial Calculator Guides", description: "Follow practical guides for using ThinkCalculator tools and interpreting financial estimates responsibly.", path: "/guides" })
export default function GuidesPage() { const items = getContentByType("guide"); return <SiteContainer className="py-10 sm:py-14"><nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Guides</li></ol></nav><header className="mt-8 max-w-3xl"><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Calculator Guides</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Use calculator inputs carefully, understand the outputs, and recognise the assumptions behind each estimate.</p></header><div className="mt-10"><EditorialListing items={items} emptyMessage="No published guides are available yet." /></div></SiteContainer> }
