import Link from "next/link"
import { CheckCircle2, MapPin, Search, Sparkles, Zap } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { CategoryCard } from "@/components/shared/category-card"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { categories, popularCalculators } from "@/lib/site-config"

const benefits = [
  { title: "Accurate and transparent", description: "Clear inputs and explained methods help you understand every result.", icon: CheckCircle2 },
  { title: "Fast and easy", description: "Focused tools make everyday calculations quick on any device.", icon: Zap },
  { title: "Built for India", description: "Practical tools shaped around Indian finance and everyday decisions.", icon: MapPin },
]

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-muted/30">
        <SiteContainer className="py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary"><Sparkles aria-hidden="true" /> Free calculators for smarter decisions</Badge>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Calculate smarter. Make better decisions.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Simple, transparent calculators for finance, business, health, education, and the choices that shape everyday life.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" nativeButton={false} render={<Link href="/calculators" />}>Explore calculators</Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/finance" />}>Browse finance tools</Button>
            </div>
            <div className="relative mx-auto mt-10 max-w-xl">
              <label htmlFor="calculator-search" className="sr-only">Search calculators</label>
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="calculator-search" className="h-11 bg-background pr-28 pl-10" placeholder="Search calculators" readOnly />
              <Button className="absolute top-1 right-1" nativeButton={false} render={<Link href="/calculators" />}>Browse</Button>
            </div>
          </div>
        </SiteContainer>
      </section>

      <section className="py-16 sm:py-20">
        <SiteContainer>
          <SectionHeading eyebrow="Popular tools" title="Start with a useful calculation" description="Explore commonly needed tools designed to make important numbers easier to understand." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{popularCalculators.map((calculator) => <CalculatorCard key={calculator.title} calculator={calculator} />)}</div>
        </SiteContainer>
      </section>

      <section className="border-y bg-muted/30 py-16 sm:py-20">
        <SiteContainer>
          <SectionHeading eyebrow="Categories" title="Find the right tool for your decision" description="Browse calculators by the part of life or work you are thinking about." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <CategoryCard key={category.href} category={category} />)}</div>
        </SiteContainer>
      </section>

      <section className="py-16 sm:py-20">
        <SiteContainer>
          <SectionHeading align="center" eyebrow="Why ThinkCalculator" title="Numbers made easier to act on" description="Useful calculations should feel understandable, dependable, and calm." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => { const Icon = benefit.icon; return <Card key={benefit.title} className="text-center"><CardHeader><span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-muted"><Icon className="size-5" aria-hidden="true" /></span><CardTitle className="text-lg">{benefit.title}</CardTitle></CardHeader><CardContent><p className="leading-6 text-muted-foreground">{benefit.description}</p></CardContent></Card> })}
          </div>
        </SiteContainer>
      </section>
    </>
  )
}
