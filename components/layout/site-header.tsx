import Link from "next/link"
import { Search } from "lucide-react"

import { MobileNavigation } from "@/components/layout/mobile-navigation"
import { SiteContainer } from "@/components/layout/site-container"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import { mainNavigation } from "@/lib/site-config"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75">
      <SiteContainer className="flex h-16 items-center justify-between gap-4">
        <BrandLogo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {mainNavigation.map((item) => (
            <Button key={item.href} variant="ghost" nativeButton={false} render={<Link href={item.href} />}>
              {item.title}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Button className="hidden sm:inline-flex" variant="outline" nativeButton={false} render={<Link href="/calculators" />}>
            <Search aria-hidden="true" /> Search
          </Button>
          <div className="lg:hidden"><MobileNavigation /></div>
        </div>
      </SiteContainer>
    </header>
  )
}
