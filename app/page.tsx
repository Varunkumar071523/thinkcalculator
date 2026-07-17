import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight, BarChart3, BookOpen, CheckCircle2, FileText, MapPin, Send, Share2,
} from "lucide-react"

import { HomeHeroCalculator } from "@/components/home/home-hero-calculator"
import { SiteContainer } from "@/components/layout/site-container"
import { CalculatorGrid } from "@/components/shared/calculator-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import { calculatorGroups, calculatorGroupStyles, countByGroup, toGroupedCalculators } from "@/lib/calculator-taxonomy"
import { createPageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = createPageMetadata({
  title: "ThinkCalculator: Free Financial Calculators for India",
  description: "Use free calculators for EMI, SIP, lumpsum investments, fixed deposits, recurring deposits, and more. View formulas, schedules, and shareable results.",
  path: "/",
})

const publishedCalculators = calculatorRegistry.filter((calculator) => calculator.status === "published")
const groupedCalculators = toGroupedCalculators(calculatorRegistry)
const groupCounts = countByGroup(groupedCalculators)

const categoryTiles = calculatorGroups.map((group) => ({
  ...group,
  count: groupCounts[group.id],
  style: calculatorGroupStyles[group.id],
  description: {
    loans: "Repayments and borrowing costs.",
    investments: "Regular and one-time growth.",
    savings: "FD, RD, and PPF maturity values.",
    taxes: "Income tax, HRA, and gratuity.",
    business: "Everyday business arithmetic.",
  }[group.id],
  href: { loans: "/finance", investments: "/finance", savings: "/finance", taxes: "/finance", business: "/business" }[group.id],
}))

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

      <section className="overflow-hidden bg-muted/30">
        <SiteContainer className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Free financial calculators for India</p>
            <h1 className="mt-3.5 font-serif text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
              Know your number <em className="text-money">before</em> you decide.
            </h1>
            <p className="mt-4 max-w-[46ch] text-base leading-7 text-muted-foreground">Loan EMIs, investment growth, deposits, and tax — with the formula shown, not just the answer.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" nativeButton={false} render={<Link href="/calculators" />}>Explore calculators <ArrowRight aria-hidden="true" /></Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/finance" />}>Browse finance tools</Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-money" aria-hidden="true" />{publishedCalculators.length} calculators, no login</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-money" aria-hidden="true" />Shareable results</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-money" aria-hidden="true" />Built for ₹ and Indian tax rules</span>
            </div>
          </div>

          <HomeHeroCalculator />
        </SiteContainer>
      </section>

      <section className="border-t border-line py-10 sm:py-12">
        <SiteContainer>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">{publishedCalculators.length} calculators</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Find your number</h2>
              <p className="mt-1.5 max-w-[52ch] text-[14.5px] text-muted-foreground">Explore loans, investments, savings, and tax calculators with transparent methods and visible limitations.</p>
            </div>
            <Button variant="outline" className="shrink-0" nativeButton={false} render={<Link href="/calculators" />}>View all <ArrowRight aria-hidden="true" /></Button>
          </div>
          <div className="mt-6">
            <CalculatorGrid calculators={groupedCalculators} />
          </div>
        </SiteContainer>
      </section>

      <section className="border-t border-line py-10 sm:py-12">
        <SiteContainer>
          <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Browse by category</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Or start from your decision</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categoryTiles.map((tile) => (
              <Link key={tile.id} href={tile.href} className={cn("group rounded-xl border border-line bg-card p-4.5 transition-colors hover:bg-muted/40 border-t-[3px]", tile.style.border.replace("border-l-", "border-t-"))}>
                <span className="mb-2 block font-mono text-[11px] text-muted-foreground">{String(tile.count).padStart(2, "0")} tools</span>
                <h3 className="text-[15px] font-semibold">{tile.label}</h3>
                <p className="mt-1 text-[12.5px] leading-[1.4] text-muted-foreground">{tile.description}</p>
              </Link>
            ))}
          </div>
        </SiteContainer>
      </section>

      <section className="border-t border-line py-10 sm:py-12">
        <SiteContainer>
          <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Why ThinkCalculator</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Clear results, with the working shown</h2>
          <div className="mt-6 grid overflow-hidden rounded-xl border border-line sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ title, description, icon: Icon }, index) => (
              <div key={title} className={`border-line p-5 ${index < benefits.length - 1 ? "border-b sm:border-r sm:border-b-0" : ""} ${index === 1 ? "sm:border-r-0 lg:border-r" : ""}`}>
                <Icon className="mb-2 size-[18px] text-money" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-[1.4] text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      <section className="border-t border-line py-10 sm:py-12">
        <SiteContainer>
          <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Learning resources</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Build confidence behind the calculation</h2>
          <p className="mt-1.5 max-w-[60ch] text-[14.5px] text-muted-foreground">Read practical articles and guides that explain inputs, assumptions, and results.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {resources.map((resource) => (
              <div key={resource.title} className="flex h-full flex-col rounded-xl border border-line bg-card p-5">
                <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-money-soft text-money"><BookOpen className="size-4.5" aria-hidden="true" /></span>
                <h3 className="text-[15.5px] font-semibold">{resource.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-6 text-muted-foreground">{resource.description}</p>
                <Link href={resource.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-money underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Read the resource <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
              </div>
            ))}
          </div>
        </SiteContainer>
      </section>

      <section className="border-t border-line bg-muted/30 py-10 sm:py-12">
        <SiteContainer>
          <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Financial glossary</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Useful terms, explained simply</h2>
          <dl className="mt-6 grid overflow-hidden rounded-xl border border-line bg-card sm:grid-cols-2 lg:grid-cols-3">{glossary.map(([term, definition]) => <div key={term} className="border-line border-b p-5 last:border-b-0 sm:border-r lg:nth-[3n]:border-r-0"><dt className="font-semibold">{term}</dt><dd className="mt-2 leading-6 text-muted-foreground">{definition}</dd></div>)}</dl>
        </SiteContainer>
      </section>

      <section className="border-t border-line py-10 sm:py-12">
        <SiteContainer className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-money uppercase">Frequently asked questions</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Know what the result means</h2>
            <p className="mt-1.5 max-w-[52ch] text-[14.5px] text-muted-foreground">Understand how to use, save, and interpret ThinkCalculator results.</p>
          </div>
          <div className="divide-y divide-line rounded-xl border border-line">{faqs.map(([question, answer]) => <details key={question} className="group p-5"><summary className="cursor-pointer list-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{question}<span className="float-right ml-4 text-money transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{answer}</p></details>)}</div>
        </SiteContainer>
      </section>

      <section className="border-t border-line bg-primary text-primary-foreground">
        <SiteContainer className="py-10 sm:py-12"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div className="max-w-2xl"><Badge className="bg-primary-foreground/10 text-primary-foreground" variant="outline"><FileText aria-hidden="true" /> Coming soon</Badge><h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Helpful finance notes, without the noise</h2><p className="mt-3 leading-7 text-primary-foreground/75">Finance guides and calculator updates are planned. Newsletter subscriptions are not open yet, and no email addresses are being collected.</p></div><form className="flex w-full max-w-md flex-col gap-3 sm:flex-row" aria-label="Newsletter preview"><label htmlFor="newsletter-email" className="sr-only">Email address</label><Input id="newsletter-email" type="email" placeholder="you@example.com" disabled className="h-10 bg-background text-foreground sm:w-64" /><Button type="button" variant="secondary" disabled><Send aria-hidden="true" /> Subscribe</Button></form></div></SiteContainer>
      </section>
    </>
  )
}
