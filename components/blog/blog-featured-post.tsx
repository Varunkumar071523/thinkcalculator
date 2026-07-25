import Link from "next/link"
import { LineChart, PiggyBank, ReceiptIndianRupee, WalletCards, type LucideIcon } from "lucide-react"

import { formatIsoDate } from "@/lib/formatters"
import type { EditorialContentSummary } from "@/types/editorial-content"

const categoryIcons: Record<string, LucideIcon> = { loans: WalletCards, investing: LineChart, savings: PiggyBank, tax: ReceiptIndianRupee }

export function BlogFeaturedPost({ item }: { readonly item: EditorialContentSummary }) {
  const Icon = categoryIcons[item.category.slug] ?? WalletCards
  return (
    <Link
      href={item.canonicalPath}
      className="group grid overflow-hidden rounded-xl border border-line bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[0.9fr_1.1fr]"
    >
      <div className="flex min-h-44 items-center justify-center bg-gradient-to-br from-money-soft to-gold-soft">
        <Icon className="size-11 text-money" aria-hidden="true" />
      </div>
      <div className="p-6">
        <p className="text-[11.5px] font-semibold tracking-wide text-money uppercase">{item.category.name}</p>
        <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight group-hover:underline">{item.title}</h2>
        <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{item.description}</p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {formatIsoDate(item.publishedAt)} · {item.estimatedReadingMinutes} min read
        </p>
      </div>
    </Link>
  )
}
