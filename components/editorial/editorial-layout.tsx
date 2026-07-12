import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SiteContainer } from "@/components/layout/site-container"
import { getTableOfContents } from "@/features/content"
import type { EditorialContentItem } from "@/types/editorial-content"
import { EditorialAuthorCard } from "./editorial-author-card"
import { EditorialFAQ } from "./editorial-faq"
import { EditorialHeader } from "./editorial-header"
import { EditorialRelatedCalculators } from "./editorial-related-calculators"
import { EditorialRelatedContent } from "./editorial-related-content"
import { EditorialSection } from "./editorial-section"
import { EditorialTableOfContents } from "./editorial-table-of-contents"

export function EditorialLayout({ item }: { readonly item: EditorialContentItem }) {
  const index = item.type === "blog" ? { label: "Blog", href: "/blog" } : { label: "Guides", href: "/guides" }
  return <SiteContainer className="py-10 sm:py-14"><article className="mx-auto max-w-4xl"><nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><li><Link href="/">Home</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li><Link href={index.href}>{index.label}</Link></li><li aria-hidden><ChevronRight className="size-3.5" /></li><li aria-current="page" className="text-foreground">{item.title}</li></ol></nav><div className="mt-8"><EditorialHeader item={item} /></div><div className="mt-10"><EditorialTableOfContents items={getTableOfContents(item)} /></div><div className="mt-12 space-y-12">{item.sections.map((section) => <EditorialSection key={section.id} section={section} />)}<EditorialRelatedCalculators links={item.relatedCalculators} /><EditorialRelatedContent links={item.relatedContent} /><EditorialFAQ faqs={item.faqs} />{item.disclaimer ? <aside className="rounded-xl border bg-muted/30 p-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Important:</strong> {item.disclaimer}</aside> : null}<EditorialAuthorCard author={item.author} /></div></article></SiteContainer>
}
