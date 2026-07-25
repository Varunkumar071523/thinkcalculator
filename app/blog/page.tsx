import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { BlogListing } from "@/components/blog/blog-listing"
import { getContentByType } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({ title: "Financial Calculations Blog", description: "Read clear, India-relevant explanations of loans, investing, savings, and the calculations behind everyday financial decisions.", path: "/blog" })

export default function BlogPage() {
  const items = getContentByType("blog")

  return (
    <SiteContainer className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Blog</li></ol></nav>
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Blog</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Practical money reading</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">Articles that explain the thinking behind a calculation — not just the number it produces.</p>
      </header>

      <div className="mt-8">
        <BlogListing items={items} />
      </div>
    </SiteContainer>
  )
}
