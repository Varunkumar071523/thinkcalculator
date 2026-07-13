import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { TopicLearningPathStep } from "@/types/content-cluster"

export function TopicLearningPath({ steps }: { readonly steps: readonly TopicLearningPathStep[] }) {
  if (!steps.length) return null
  return (
    <section className="mt-12 rounded-2xl border bg-muted/30 p-6 sm:p-8" aria-labelledby="start-here-heading">
      <h2 id="start-here-heading" className="text-2xl font-semibold tracking-tight">Start here</h2>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Follow this sequence from explanation and terminology to practical use.</p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.destination.canonicalPath}>
            <Link href={step.destination.canonicalPath} className="group block h-full rounded-xl border bg-background p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
              <span className="mt-1 flex items-center justify-between gap-3 text-lg font-semibold">{step.title}<ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              <span className="mt-2 block leading-6 text-muted-foreground">{step.description}</span>
              <span className="mt-3 block text-sm font-medium text-primary">Go to {step.destination.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
