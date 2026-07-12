import type { MetadataRoute } from "next"

import { siteConfig } from "./site-config"

export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
] as const

export const webManifest: MetadataRoute.Manifest = {
  name: siteConfig.name,
  short_name: siteConfig.name,
  description: siteConfig.description,
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#1e3a5f",
  lang: "en-IN",
  categories: ["finance", "utilities", "education"],
  icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
}
