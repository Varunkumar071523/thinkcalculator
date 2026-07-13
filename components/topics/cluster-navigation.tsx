import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { resolveClusterNavigation } from "@/features/content/cluster-relations"
import type { ClusterResourceType } from "@/types/content-cluster"

const typeLabels: Record<ClusterResourceType, string> = {
  calculator: "Calculator",
  blog: "Article",
  guide: "Guide",
  glossary: "Key term",
  topic: "Topic hub",
}

type Props = Readonly<{
  resourceId: string
  authoredLinks?: readonly Readonly<{ href: string }>[]
  variant?: "full" | "compact"
  className?: string
}>

export function ClusterNavigation({ resourceId, authoredLinks = [], variant = "full", className }: Props) {
  const navigation = resolveClusterNavigation(resourceId, authoredLinks)
  if (!navigation) return null

  const headingId = `cluster-navigation-${resourceId}`
  const content = (
    <>
      <h2 id={headingId} className={variant === "full" ? "text-2xl font-semibold tracking-tight sm:text-3xl" : "font-semibold"}>Explore this topic</h2>
      <p className="mt-2 leading-6 text-muted-foreground">
        {navigation.topics.length > 0
          ? `Continue through the public learning ${navigation.topics.length === 1 ? "hub" : "hubs"} and related resources connected to this page.`
          : "Continue with the related public resources connected to this page."}
      </p>
      <ul className={variant === "full" ? "mt-5 grid gap-3 sm:grid-cols-2" : "mt-5 grid gap-3"}>
        {navigation.topics.map((topic) => (
          <li key={topic.canonicalPath}>
            <Link href={topic.canonicalPath} className="group block rounded-xl border bg-primary/5 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-sm font-semibold text-primary">{typeLabels[topic.type]}</span>
              <span className="mt-1 flex items-center justify-between gap-3 font-semibold">{topic.title}<ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{topic.description}</span>
            </Link>
          </li>
        ))}
        {navigation.related.map((link) => (
          <li key={link.canonicalPath}>
            <Link href={link.canonicalPath} className="group block rounded-xl border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-sm font-semibold text-primary">{typeLabels[link.type]}</span>
              <span className="mt-1 flex items-center justify-between gap-3 font-semibold">{link.title}<ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )

  return variant === "compact"
    ? <div className={className} aria-labelledby={headingId}>{content}</div>
    : <section className={className} aria-labelledby={headingId}>{content}</section>
}
