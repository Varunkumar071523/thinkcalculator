import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { createCanonicalUrl, createOpenGraph } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })
const rootTitle = `${siteConfig.name} — ${siteConfig.tagline}`

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: rootTitle, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  alternates: { canonical: createCanonicalUrl("/") },
  openGraph: createOpenGraph({ title: rootTitle, description: siteConfig.description, path: "/" }),
  twitter: { card: "summary_large_image", title: rootTitle, description: siteConfig.description, images: [{ url: "/opengraph-image", alt: "ThinkCalculator — Calculate. Compare. Decide. Financial calculators for India." }] },
  robots: { index: true, follow: true },
}

const rootStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: siteConfig.name, url: siteConfig.url },
    { "@type": "WebSite", "@id": `${siteConfig.url}/#website`, name: siteConfig.name, url: siteConfig.url, description: siteConfig.description, publisher: { "@id": `${siteConfig.url}/#organization` }, inLanguage: "en-IN" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData).replace(/</g, "\\u003c") }} />
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-background px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-ring">Skip to main content</a>
        <SiteHeader />
        <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
