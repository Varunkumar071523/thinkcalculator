import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { createCanonicalUrl, createOpenGraph } from "@/lib/seo"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const rootTitle = `${siteConfig.name} — ${siteConfig.tagline}`

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: rootTitle, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  alternates: { canonical: createCanonicalUrl("/") },
  openGraph: createOpenGraph({ title: rootTitle, description: siteConfig.description, path: "/" }),
  twitter: { card: "summary", title: rootTitle, description: siteConfig.description },
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
