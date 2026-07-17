import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, LineChart, PiggyBank, ReceiptIndianRupee, WalletCards, type LucideIcon } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { getContentByType } from "@/features/content"
import { createPageMetadata } from "@/lib/seo"
import type { EditorialContentSummary } from "@/types/editorial-content"

export const metadata: Metadata = createPageMetadata({ title: "Financial Calculations Blog", description: "Read clear, India-relevant explanations of loans, investing, savings, and the calculations behind everyday financial decisions.", path: "/blog" })

const categoryIcons: Record<string, LucideIcon> = { loans: WalletCards, investing: LineChart, savings: PiggyBank, tax: ReceiptIndianRupee }

export default function BlogPage() {
  const items = getContentByType("blog")
  const [featured, ...rest] = items

  return (
    <SiteContainer className="py-10 sm:py-12">
      <nav aria-label="Breadcrumb"><ol className="flex items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">Blog</li></ol></nav>
      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Blog</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Practical money reading</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">Articles that explain the thinking behind a calculation — not just the number it produces.</p>
      </header>

      {items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-line bg-card p-6 text-muted-foreground">No published blog articles are available yet.</p>
      ) : (
        <div className="mt-8">
          <FeaturedPost item={featured} />
          {rest.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {rest.map((item) => <PostCard key={item.id} item={item} />)}
            </div>
          ) : null}
        </div>
      )}
    </SiteContainer>
  )
}

function FeaturedPost({ item }: { readonly item: EditorialContentSummary }) {
  const Icon = categoryIcons[item.category.slug] ?? WalletCards
  return (
    <Link href={item.canonicalPath} className="group grid overflow-hidden rounded-xl border border-line bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[0.9fr_1.1fr]">
      <div className="flex min-h-44 items-center justify-center bg-gradient-to-br from-money-soft to-gold-soft">
        <Icon className="size-11 text-money" aria-hidden="true" />
      </div>
      <div className="p-6">
        <p className="text-[11.5px] font-semibold tracking-wide text-money uppercase">{item.category.name}</p>
        <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight group-hover:underline">{item.title}</h2>
        <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{item.description}</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">{item.estimatedReadingMinutes} min read</p>
      </div>
    </Link>
  )
}

function PostCard({ item }: { readonly item: EditorialContentSummary }) {
  return (
    <Link href={item.canonicalPath} className="group rounded-xl border border-line bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <p className="text-[11px] font-semibold tracking-wide text-gold uppercase">{item.category.name}</p>
      <h3 className="mt-2 text-base font-semibold group-hover:underline">{item.title}</h3>
      <p className="mt-2 text-[13px] leading-[1.45] text-muted-foreground">{item.description}</p>
      <p className="mt-2.5 font-mono text-xs text-muted-foreground">{item.estimatedReadingMinutes} min read</p>
    </Link>
  )
}
