import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const resourceLinks = [
  { title: "Blog", description: "Explanations of financial calculations and trade-offs.", href: "/blog" },
  { title: "Guides", description: "Step-by-step help for using and interpreting calculators.", href: "/guides" },
  { title: "Glossary", description: "Plain-language definitions of common financial terms.", href: "/glossary" },
  { title: "Topics", description: "Curated learning paths that connect related resources.", href: "/topics" },
] as const

export function ResourceDirectory() {
  return (
    <section className="mt-10" aria-labelledby="browse-resources">
      <h2 id="browse-resources" className="text-2xl font-semibold tracking-tight">Browse learning resources</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {resourceLinks.map((resource) => (
          <Link key={resource.href} href={resource.href} className="group rounded-xl border bg-card p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex items-center justify-between gap-3 font-semibold">{resource.title}<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
            <span className="mt-2 block leading-6 text-muted-foreground">{resource.description}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
