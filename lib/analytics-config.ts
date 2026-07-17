// Single source of truth for whether GA4 is actually live on this build, so app/layout.tsx (which
// decides whether to inject the script) and components/layout/site-footer.tsx (which decides
// whether to show the visitor-facing notice) can never drift out of sync with each other.
//
// Gated on STATIC_EXPORT rather than NODE_ENV: `next build` also runs with NODE_ENV=production for
// local dev builds and for the Playwright e2e suite (package.json's "test" script), so NODE_ENV
// alone cannot tell a real Hostinger production build apart from a test build. STATIC_EXPORT is
// only ever set by scripts/build-export.mjs, which is exclusively the Hostinger deploy path (see
// next.config.ts and docs/DECISIONS.md decision 23) — so it doubles as an "is this the real
// production build" flag. The measurement ID is required too, so an empty/unset env var can never
// result in an empty gtag id being injected.
export function getAnalyticsConfig(): { enabled: boolean; measurementId: string | undefined } {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const isProductionExport = process.env.STATIC_EXPORT === "true"
  return { enabled: isProductionExport && Boolean(measurementId), measurementId }
}
