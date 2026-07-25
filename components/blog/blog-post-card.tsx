import Link from "next/link"

import { formatIsoDate } from "@/lib/formatters"
import type { EditorialContentSummary } from "@/types/editorial-content"

export function BlogPostCard({ item }: { readonly item: EditorialContentSummary }) {
  return (
    <Link
      href={item.canonicalPath}
      className="group rounded-xl border border-line bg-card p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="text-[11px] font-semibold tracking-wide text-gold uppercase">{item.category.name}</p>
      <h3 className="mt-2 text-base font-semibold group-hover:underline">{item.title}</h3>
      <p className="mt-2 text-[13px] leading-[1.45] text-muted-foreground">{item.description}</p>
      <p className="mt-2.5 font-mono text-xs text-muted-foreground">
        {formatIsoDate(item.publishedAt)} · {item.estimatedReadingMinutes} min read
      </p>
    </Link>
  )
}
