import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { getContentByType } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({ title: "Financial Calculator Guides", description: "Follow practical guides for using ThinkCalculator tools and interpreting financial estimates responsibly.", path: "/guides" })

export default function GuidesPage() {
  const items = getContentByType("guide")

  return (
    <SiteContainer className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Guides</li></ol></nav>
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Guides</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Step-by-step money guides</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">Longer walkthroughs for decisions with more than one moving part.</p>
      </header>

      {items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-line bg-card p-6 text-muted-foreground">No published guides are available yet.</p>
      ) : (
        <div className="mt-8 space-y-3.5">
          {items.map((item, index) => (
            <Link key={item.id} href={item.canonicalPath} className="group flex gap-4.5 rounded-xl border border-line bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:items-start">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-money-soft font-mono text-[13px] font-semibold text-money">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold group-hover:underline">{item.title}</h2>
                <p className="mt-1.5 max-w-[60ch] text-[13.5px] leading-6 text-muted-foreground">{item.description}</p>
                {item.sections.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.sections.slice(0, 3).map((section) => (
                      <span key={section.id} className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">{section.title}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </SiteContainer>
  )
}
