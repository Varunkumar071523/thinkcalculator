import { calculatorRegistry } from "../../features/calculators/core/calculator-registry"
import { getPublishedContent, getPublishedGlossaryTerms, getPublicTopics } from "../../features/content"

// Every static/SSG route this route currently serves as real, navigable HTML — used to drive the
// permanent accessibility sweep in a11y.spec.ts. Rebuilt from the same registries app/sitemap.ts
// uses (plus a handful of static pages sitemap.ts does not list, and the draft demo calculator,
// which is real reachable HTML even though it is noindex/excluded from the sitemap) so this list
// can never silently drift stale as calculators/content/topics/glossary terms are added or removed.
const staticPages = [
  "/",
  "/about",
  "/blog",
  "/business",
  "/calculators",
  "/calculators/demo",
  "/contact",
  "/disclaimer",
  "/education",
  "/finance",
  "/glossary",
  "/guides",
  "/health",
  "/privacy-policy",
  "/search",
  "/topics",
] as const

export type AuditRoute = { readonly path: string; readonly label: string }

function dedupe(routes: readonly AuditRoute[]): readonly AuditRoute[] {
  const seen = new Set<string>()
  return routes.filter((route) => (seen.has(route.path) ? false : (seen.add(route.path), true)))
}

export function getAllAuditRoutes(): readonly AuditRoute[] {
  const calculators = calculatorRegistry
    .filter((item) => item.status === "published")
    .map((item) => ({ path: item.canonicalPath, label: `calculator:${item.slug}` }))
  const glossary = getPublishedGlossaryTerms().map((item) => ({ path: item.canonicalPath, label: `glossary:${item.slug}` }))
  const editorial = getPublishedContent().map((item) => ({ path: item.canonicalPath, label: `${item.type}:${item.slug}` }))
  const topics = getPublicTopics().map(({ definition }) => ({ path: definition.canonicalPath, label: `topic:${definition.slug}` }))
  const statics = staticPages.map((path) => ({ path, label: `static:${path}` }))
  return dedupe([...statics, ...calculators, ...glossary, ...editorial, ...topics])
}
