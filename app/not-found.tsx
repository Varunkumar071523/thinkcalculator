import Link from "next/link"
import { ArrowRight, Calculator } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { Button } from "@/components/ui/button"

const calculatorLinks = [
  ["EMI Calculator", "/finance/emi-calculator"], ["SIP Calculator", "/finance/sip-calculator"], ["Lumpsum Calculator", "/finance/lumpsum-calculator"], ["FD Calculator", "/finance/fd-calculator"], ["RD Calculator", "/finance/rd-calculator"],
] as const

export default function NotFound() {
  return <SiteContainer className="py-16 sm:py-24"><div className="mx-auto max-w-3xl text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Calculator aria-hidden="true" /></span><p className="mt-6 text-sm font-semibold text-muted-foreground">Error 404</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Page not found</h1><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">The page may have moved or the address may be incorrect. Choose a working section below.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" nativeButton={false} render={<Link href="/" />}>Homepage</Button><Button size="lg" variant="outline" nativeButton={false} render={<Link href="/calculators" />}>All calculators</Button><Button size="lg" variant="outline" nativeButton={false} render={<Link href="/finance" />}>Finance calculators</Button></div><nav aria-label="Production calculators" className="mt-12 grid gap-3 text-left sm:grid-cols-2">{calculatorLinks.map(([title, href]) => <Link key={href} href={href} className="group flex items-center justify-between rounded-xl border p-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{title}<ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>)}</nav></div></SiteContainer>
}
