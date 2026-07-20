import type { GlossaryTerm } from "@/types/glossary-content"

export type GlossaryMatcher = Readonly<{ regex: RegExp; byName: ReadonlyMap<string, GlossaryTerm> }>

export type GlossaryTextSegment =
  | Readonly<{ type: "text"; text: string }>
  | Readonly<{ type: "link"; text: string; term: GlossaryTerm }>

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Longer term names are listed first in the alternation so a multi-word term (e.g. "Interest Rate")
// is matched whole rather than only its shorter substring being reachable at that position.
export function createGlossaryMatcher(terms: readonly GlossaryTerm[]): GlossaryMatcher {
  const sorted = [...terms].sort((a, b) => b.term.length - a.term.length)
  const byName = new Map(sorted.map((term) => [term.term.toLowerCase(), term]))
  const pattern = sorted.map((term) => escapeRegExp(term.term)).join("|")
  const regex = new RegExp(`\\b(?:${pattern})\\b`, "gi")
  return { regex, byName }
}

// Scans `text` for whitelisted glossary term names and links only the first occurrence of each
// term across the caller-supplied `linkedSlugs` set, which callers share across an entire page
// (e.g. every FAQ answer on one calculator) so a term already linked earlier in the page is left
// as plain text on later occurrences instead of being linked again.
export function linkGlossaryTermsInText(
  text: string,
  matcher: GlossaryMatcher,
  linkedSlugs: Set<string>,
): readonly GlossaryTextSegment[] {
  const segments: GlossaryTextSegment[] = []
  let lastIndex = 0
  matcher.regex.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = matcher.regex.exec(text)) !== null) {
    const matchedText = match[0]
    const term = matcher.byName.get(matchedText.toLowerCase())
    if (!term || linkedSlugs.has(term.slug)) continue
    if (match.index > lastIndex) segments.push({ type: "text", text: text.slice(lastIndex, match.index) })
    segments.push({ type: "link", text: matchedText, term })
    linkedSlugs.add(term.slug)
    lastIndex = match.index + matchedText.length
  }
  if (lastIndex < text.length) segments.push({ type: "text", text: text.slice(lastIndex) })
  return segments
}
