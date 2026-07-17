import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { getAnalyticsConfig } from "@/lib/analytics-config"
import { createCanonicalUrl, createOpenGraph, createRootStructuredData } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })
const rootTitle = `${siteConfig.name} — ${siteConfig.tagline}`
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: rootTitle, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  alternates: { canonical: createCanonicalUrl("/") },
  openGraph: createOpenGraph({ title: rootTitle, description: siteConfig.description, path: "/" }),
  twitter: { card: "summary_large_image", title: rootTitle, description: siteConfig.description, images: [{ url: "/opengraph-image", alt: "ThinkCalculator — Calculate. Compare. Decide. Financial calculators for India." }] },
  robots: { index: true, follow: true },
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
}

const rootStructuredData = createRootStructuredData()
const analyticsConfig = getAnalyticsConfig()

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData).replace(/</g, "\\u003c") }} />
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-background px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-ring">Skip to main content</a>
        <SiteHeader />
        <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
        <SiteFooter />
        {analyticsConfig.enabled && <GoogleAnalytics measurementId={analyticsConfig.measurementId!} />}
      </body>
    </html>
  )
}
