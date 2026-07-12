import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SiteContainer } from "@/components/layout/site-container"
import { EditorialListing } from "@/components/editorial/editorial-listing"
import { getContentByType } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"
export const metadata: Metadata = createPageMetadata({ title: "Financial Calculations Blog", description: "Read clear, India-relevant explanations of loans, investing, savings, and the calculations behind everyday financial decisions.", path: "/blog" })
export default function BlogPage() { const items = getContentByType("blog"); return <SiteContainer className="py-10 sm:py-14"><nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Blog</li></ol></nav><header className="mt-8 max-w-3xl"><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">ThinkCalculator Blog</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Understand the ideas behind financial calculations with practical, educational articles written for Indian readers.</p></header><div className="mt-10"><EditorialListing items={items} emptyMessage="No published blog articles are available yet." /></div></SiteContainer> }
