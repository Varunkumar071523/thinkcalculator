import Link from "next/link"

type Resource = Readonly<{ id: string; title: string; description: string; href: string; label?: string }>

export function TopicResourceSection({ id, title, description, resources }: { readonly id: string; readonly title: string; readonly description: string; readonly resources: readonly Resource[] }) {
  return (
    <section aria-labelledby={id}>
      <div className="max-w-3xl"><h2 id={id} className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{description}</p></div>
      {resources.length > 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{resources.map((resource) => <article key={resource.id} className="rounded-xl border bg-card p-5">{resource.label ? <p className="text-sm font-medium text-primary">{resource.label}</p> : null}<h3 className="mt-1 text-xl font-semibold"><Link href={resource.href} className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{resource.title}</Link></h3><p className="mt-3 leading-7 text-muted-foreground">{resource.description}</p><Link href={resource.href} className="mt-4 inline-block rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Explore {resource.title}</Link></article>)}</div> : <p className="mt-6 rounded-xl border border-dashed p-5 text-muted-foreground">No published resources are available in this section yet.</p>}
    </section>
  )
}
