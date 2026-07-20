import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getRecentChangelogEntries } from "@/lib/changelog"
import { formatIsoDate } from "@/lib/formatters"

export function ChangelogBlock() {
  const entries = getRecentChangelogEntries(4)
  if (entries.length === 0) return null

  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={`${entry.date}-${entry.title}`} className="rounded-xl border border-line bg-card p-5">
          <time dateTime={entry.date} className="font-mono text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {formatIsoDate(entry.date)}
          </time>
          <h3 className="mt-1.5 text-[15.5px] font-semibold">{entry.title}</h3>
          <p className="mt-1.5 text-[13.5px] leading-6 text-muted-foreground">{entry.description}</p>
          {entry.link ? (
            <Link href={entry.link.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-money underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {entry.link.label} <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
