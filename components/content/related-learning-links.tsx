import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { CalculatorLearningLink } from "@/types/calculator-content"

export function RelatedLearningLinks({ links }: { links: readonly CalculatorLearningLink[] }) {
  return <section aria-labelledby="related-learning-heading"><h3 id="related-learning-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">Related learning</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{links.map((link) => <Link key={link.href} href={link.href} className="group rounded-xl border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex items-center justify-between font-medium">{link.title}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span><span className="mt-2 block text-sm leading-6 text-muted-foreground">{link.description}</span></Link>)}</div></section>
}
