import Link from "next/link"

import { SiteContainer } from "@/components/layout/site-container"
import { BrandLogo } from "@/components/shared/brand-logo"
import { Separator } from "@/components/ui/separator"
import { getAnalyticsConfig } from "@/lib/analytics-config"
import { footerGroups, siteConfig } from "@/lib/site-config"

export function SiteFooter() {
  const { enabled: analyticsEnabled } = getAnalyticsConfig()
  return (
    <footer className="border-t bg-muted/30">
      <SiteContainer className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_3fr]">
          <div className="max-w-sm">
            <BrandLogo />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{siteConfig.description}</p>
            <p className="mt-2 text-sm font-medium">{siteConfig.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold">{group.title}</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {group.links.map((link) => (
                    <li key={link.href}><Link className="hover:text-foreground" href={link.href}>{link.title}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col gap-3 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
          <p>© {new Date().getFullYear()} ThinkCalculator. All rights reserved.</p>
          <p className="max-w-2xl sm:text-right">Calculations are provided for informational purposes only. Verify important results and consult a qualified professional when appropriate.</p>
        </div>
        {analyticsEnabled && (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This site uses Google Analytics to understand visitor traffic. Calculator inputs are never sent to analytics or any third party — see our{" "}
            <Link className="underline hover:text-foreground" href="/privacy-policy">privacy policy</Link>.
          </p>
        )}
      </SiteContainer>
    </footer>
  )
}
