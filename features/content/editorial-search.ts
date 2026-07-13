import type { EditorialSearchDocument } from "@/types/editorial-search"
import { getPublishedContent } from "./content-registry"
import { normalizeEditorialSearchText } from "./editorial-search-query"
import { getPublishedGlossaryTerms } from "./glossary-registry"
import { getPublicTopics } from "./topic-registry"

export function createEditorialSearchDocuments(): readonly EditorialSearchDocument[] {
  const editorial: EditorialSearchDocument[] = getPublishedContent().map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    canonicalPath: item.canonicalPath,
    context: item.category.name,
    searchable: {
      title: normalizeEditorialSearchText([item.title]),
      keywords: normalizeEditorialSearchText([
        item.category.name,
        item.category.slug,
        ...item.tags.flatMap((tag) => [tag.name, tag.slug]),
        ...item.metadata.keywords,
      ]),
      description: normalizeEditorialSearchText([item.description, item.excerpt]),
    },
  }))

  const glossary: EditorialSearchDocument[] = getPublishedGlossaryTerms().map((item) => ({
    id: item.id,
    type: "glossary",
    title: item.term,
    description: item.shortDefinition,
    canonicalPath: item.canonicalPath,
    context: "Financial glossary",
    searchable: {
      title: normalizeEditorialSearchText([item.term]),
      keywords: normalizeEditorialSearchText([item.slug, ...item.metadata.keywords]),
      description: normalizeEditorialSearchText([item.shortDefinition, item.metadata.description]),
    },
  }))

  const topics: EditorialSearchDocument[] = getPublicTopics().map(({ definition }) => ({
    id: definition.id,
    type: "topic",
    title: definition.name,
    description: definition.description,
    canonicalPath: definition.canonicalPath,
    context: "Learning hub",
    searchable: {
      title: normalizeEditorialSearchText([definition.name]),
      keywords: normalizeEditorialSearchText([
        definition.slug,
        ...(definition.metadata.keywords ?? []),
        ...definition.startHere.flatMap((step) => [step.title, step.description]),
      ]),
      description: normalizeEditorialSearchText([definition.description, definition.metadata.description, ...definition.overview]),
    },
  }))

  return [...editorial, ...glossary, ...topics]
}
