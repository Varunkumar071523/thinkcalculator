import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, BadgeIndianRupee, BarChart3, BookOpen, BriefcaseBusiness,
  CheckCircle2, FileText, IndianRupee, LineChart, MapPin,
  PiggyBank, ReceiptIndianRupee, Send, Share2, Sparkles, WalletCards,
} from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorCard } from "@/components/shared/calculator-card"
import { CalculatorSearch, type SearchableCalculator } from "@/components/shared/calculator-search"
import { CategoryCard } from "@/components/shared/category-card"
import { SectionHeading } from "@/components/shared/section-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { createPageMetadata } from "@/lib/seo"
import type { CalculatorSummary, SiteCategory } from "@/types/site"

export const metadata: Metadata = createPageMetadata({
  title: "ThinkCalculator: Free Financial Calculators for India",
  description: "Use free calculators for EMI, SIP, lumpsum investments, fixed deposits, recurring deposits, and more. View formulas, schedules, and shareable results.",
  path: "/",
})

const iconBySlug = {
  "emi-calculator": WalletCards,
  "sip-calculator": LineChart,
  "lumpsum-calculator": PiggyBank,
  "fd-calculator": IndianRupee,
  "rd-calculator": BadgeIndianRupee,
  "cagr-calculator": LineChart,
  "ppf-calculator": PiggyBank,
} as const

const publishedCalculators = calculatorRegistry.filter((calculator) => calculator.status === "published")
const calculatorCards: CalculatorSummary[] = publishedCalculators.map((calculator) => ({
  title: calculator.title,
  href: calculator.canonicalPath,
  description: calculator.description,
  category: calculator.category,
  icon: iconBySlug[calculator.slug as keyof typeof iconBySlug] ?? BarChart3,
}))
const searchableCalculators: SearchableCalculator[] = publishedCalculators.map((calculator) => ({
  id: calculator.id,
  title: calculator.title,
  shortTitle: calculator.shortTitle,
  description: calculator.description,
  category: calculator.category,
  href: calculator.canonicalPath,
}))

const homepageCategories: SiteCategory[] = [
  { title: "Loans", href: "/finance", description: "Estimate repayments and understand borrowing costs.", icon: WalletCards },
  { title: "Investments", href: "/finance", description: "Explore regular and one-time investment growth.", icon: LineChart },
  { title: "Savings", href: "/finance", description: "Plan fixed and recurring deposit maturity values.", icon: PiggyBank },
  { title: "Taxes", href: "/calculators", description: "Tax calculators are being planned for a future release.", icon: ReceiptIndianRupee, availability: "Limited tools" },
  { title: "Business", href: "/business", description: "Business-focused calculators are being prepared.", icon: BriefcaseBusiness, availability: "Limited tools" },
]

const benefits = [
  { title: "Transparent formulas", description: "See the method and assumptions behind each calculation.", icon: CheckCircle2 },
  { title: "Detailed schedules", description: "Review payment or growth schedules where they help explain results.", icon: BarChart3 },
  { title: "Shareable results", description: "Copy a result or share a link to supported calculator inputs.", icon: Share2 },
  { title: "Built for Indian users", description: "Clear rupee-based tools for common financial decisions in India.", icon: MapPin },
]

const resources = [
  { title: "Understanding loan EMI", description: "See how principal, interest rate, and tenure shape monthly repayments.", href: "/blog/understanding-loan-emi" },
  { title: "SIP vs lumpsum", description: "Compare regular contributions with a one-time investment and understand the assumptions.", href: "/blog/sip-vs-lumpsum" },
  { title: "How to estimate SIP growth", description: "Learn how contribution, return, and duration assumptions shape an estimate.", href: "/guides/how-to-estimate-sip-growth" },
]

const glossary = [
  ["EMI", "The fixed monthly payment used to repay a loan over a chosen tenure."],
  ["SIP", "A method of investing a fixed amount at regular intervals."],
  ["Principal", "The original amount borrowed, deposited, or invested."],
  ["Interest", "The cost of borrowing or the return earned on money."],
  ["Compounding", "Earning returns on both the principal and earlier returns."],
  ["Maturity amount", "The total value payable when a deposit or investment term ends."],
] as const

const faqs = [
  ["Are ThinkCalculator results exact?", "Calculator results are estimates based on the values and assumptions you enter. Actual lender, bank, or investment outcomes may differ because of fees, rate changes, rounding, taxes, and provider-specific rules."],
  ["Can I share my calculation?", "Yes. Supported calculators let you copy a shareable link containing validated input values, so another person can open the same calculation."],
  ["Can I print or save results as PDF?", "Yes. Use the calculator’s print action, then choose Print or Save as PDF in your browser’s print dialog."],
  ["Do I need to create an account?", "No account is currently required. Calculations run in your browser and ThinkCalculator does not ask you to sign in."],
  ["Are investment returns guaranteed?", "No. Investment calculator results are projections based on an assumed rate. Market-linked returns are not guaranteed and actual outcomes can be higher or lower."],
] as const

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden border-b bg-muted/30">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/5 to-transparent" aria-hidden="true" />
        <SiteContainer className="relative py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary"><Sparkles aria-hidden="true" /> Free financial calculators for smarter decisions</Badge>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Smart financial calculators for India</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">Calculate loan EMIs, investment growth, fixed deposits, recurring deposits, and more with clear formulas, schedules, and shareable results.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" nativeButton={false} render={<Link href="/calculators" />}>Explore calculators <ArrowRight aria-hidden="true" /></Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/finance" />}>Browse finance tools</Button>
            </div>
            <div className="mt-10"><CalculatorSearch calculators={searchableCalculators} /></div>
            <p className="mt-4 text-sm text-muted-foreground">Search {publishedCalculators.length} available financial calculators by name or purpose.</p>
          </div>
        </SiteContainer>
      </section>

      <section className="py-16 sm:py-20"><SiteContainer><SectionHeading eyebrow="Featured calculators" title="Start with the numbers that matter" description="Use our current finance tools to explore loans, investments, and savings with transparent methods." /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{calculatorCards.map((calculator) => <CalculatorCard key={calculator.href} calculator={calculator} />)}</div></SiteContainer></section>

      <section className="border-y bg-muted/30 py-16 sm:py-20"><SiteContainer><SectionHeading eyebrow="Browse by category" title="Find a tool for your next decision" description="Explore today’s finance calculators and see which categories are still growing." /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{homepageCategories.map((category) => <CategoryCard key={category.title} category={category} />)}</div></SiteContainer></section>

      <section className="py-16 sm:py-20"><SiteContainer><SectionHeading align="center" eyebrow="Why ThinkCalculator" title="Clear results, with the working shown" description="Practical tools should help you understand a result—not just produce a number." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ title, description, icon: Icon }) => <Card key={title}><CardHeader><span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><p className="leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}</div></SiteContainer></section>

      <section className="border-y bg-muted/30 py-16 sm:py-20"><SiteContainer><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Recently added" title="The latest calculators in our library" description={`${publishedCalculators.length} production-ready tools for common financial questions.`} /><Button variant="outline" nativeButton={false} render={<Link href="/finance" />}>View finance tools <ArrowRight aria-hidden="true" /></Button></div><div className="mt-8 divide-y rounded-xl border bg-background">{calculatorCards.map((calculator) => { const Icon = calculator.icon; return <Link key={calculator.href} href={calculator.href} className="group flex items-center gap-4 p-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block font-medium">{calculator.title}</span><span className="block truncate text-sm text-muted-foreground">{calculator.description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link> })}</div></SiteContainer></section>

      <section className="py-16 sm:py-20"><SiteContainer><SectionHeading eyebrow="Learning resources" title="Build confidence behind the calculation" description="Read practical articles and guides that explain inputs, assumptions, and results." /><div className="mt-8 grid gap-4 md:grid-cols-3">{resources.map((resource) => <Card key={resource.title}><CardHeader><span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted"><BookOpen className="size-5" aria-hidden="true" /></span><CardTitle className="text-lg">{resource.title}</CardTitle></CardHeader><CardContent className="flex h-full flex-col"><p className="leading-6 text-muted-foreground">{resource.description}</p><Link href={resource.href} className="mt-5 inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Read the resource <ArrowRight className="size-4" aria-hidden="true" /></Link></CardContent></Card>)}</div></SiteContainer></section>

      <section className="border-y bg-muted/30 py-16 sm:py-20"><SiteContainer><SectionHeading eyebrow="Financial glossary" title="Useful terms, explained simply" description="A quick reference for language you will see across our calculators." /><dl className="mt-8 grid overflow-hidden rounded-xl border bg-background sm:grid-cols-2 lg:grid-cols-3">{glossary.map(([term, definition]) => <div key={term} className="border-b p-5 last:border-b-0 sm:border-r lg:nth-[3n]:border-r-0"><dt className="font-semibold">{term}</dt><dd className="mt-2 leading-6 text-muted-foreground">{definition}</dd></div>)}</dl></SiteContainer></section>

      <section className="py-16 sm:py-20"><SiteContainer className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><SectionHeading eyebrow="Frequently asked questions" title="Know what the result means" description="Understand how to use, save, and interpret ThinkCalculator results." /><div className="divide-y rounded-xl border">{faqs.map(([question, answer]) => <details key={question} className="group p-5"><summary className="cursor-pointer list-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{question}<span className="float-right ml-4 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{answer}</p></details>)}</div></SiteContainer></section>

      <section className="border-t bg-primary text-primary-foreground"><SiteContainer className="py-14 sm:py-16"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div className="max-w-2xl"><Badge className="bg-primary-foreground/10 text-primary-foreground" variant="outline"><FileText aria-hidden="true" /> Coming soon</Badge><h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Helpful finance notes, without the noise</h2><p className="mt-3 leading-7 text-primary-foreground/75">Finance guides and calculator updates are planned. Newsletter subscriptions are not open yet, and no email addresses are being collected.</p></div><form className="flex w-full max-w-md flex-col gap-3 sm:flex-row" aria-label="Newsletter preview"><label htmlFor="newsletter-email" className="sr-only">Email address</label><Input id="newsletter-email" type="email" placeholder="you@example.com" disabled className="h-10 bg-background text-foreground sm:w-64" /><Button type="button" variant="secondary" disabled><Send aria-hidden="true" /> Subscribe</Button></form></div></SiteContainer></section>
    </>
  )
}
