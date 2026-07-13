import { calculatorRegistry } from "@/features/calculators/core/calculator-registry"
import type { ClusterNavigation, ClusterResourceLink, ClusterResourceType, TopicLearningPathStep } from "@/types/content-cluster"
import type { ResolvedTopic } from "@/types/topic-content"
import { getPublishedContent } from "./content-registry"
import { getPublishedGlossaryTerms } from "./glossary-registry"
import { getPublicTopics } from "./topic-registry"

export const CLUSTER_RELATED_LINK_LIMIT = 6

const typeOrder: Record<Exclude<ClusterResourceType, "topic">, number> = {
  calculator: 0,
  blog: 1,
  guide: 2,
  glossary: 3,
}

function getPublicResourceLinks(): readonly ClusterResourceLink[] {
  const calculators: ClusterResourceLink[] = calculatorRegistry.filter((item) => item.status === "published").map((item) => ({
    id: item.id, type: "calculator", title: item.shortTitle, description: item.description, canonicalPath: item.canonicalPath, source: "topic",
  }))
  const editorial: ClusterResourceLink[] = getPublishedContent().map((item) => ({
    id: item.id, type: item.type, title: item.title, description: item.description, canonicalPath: item.canonicalPath, source: "topic",
  }))
  const glossary: ClusterResourceLink[] = getPublishedGlossaryTerms().map((item) => ({
    id: item.id, type: "glossary", title: item.term, description: item.shortDefinition, canonicalPath: item.canonicalPath, source: "topic",
  }))
  return [...calculators, ...editorial, ...glossary]
}

function getTopicMemberIds(topic: ResolvedTopic): readonly string[] {
  return [...topic.calculators, ...topic.blogs, ...topic.guides, ...topic.glossaryTerms].map((item) => item.id)
}

export function getPublicClusterMemberships(resourceId: string): readonly ResolvedTopic[] {
  return getPublicTopics()
    .filter((topic) => getTopicMemberIds(topic).includes(resourceId))
    .toSorted((left, right) => left.definition.name.localeCompare(right.definition.name, "en-IN") || left.definition.canonicalPath.localeCompare(right.definition.canonicalPath, "en-IN"))
}

export function resolveClusterNavigation(
  resourceId: string,
  authoredLinks: readonly Readonly<{ href: string }>[] = [],
): ClusterNavigation | undefined {
  const publicResources = getPublicResourceLinks()
  const current = publicResources.find((item) => item.id === resourceId)
  const memberships = getPublicClusterMemberships(resourceId)
  if (!current || memberships.length === 0) return undefined

  const resourcesByPath = new Map(publicResources.map((item) => [item.canonicalPath, item]))
  const resourcesById = new Map(publicResources.map((item) => [item.id, item]))
  const seenPaths = new Set([current.canonicalPath])
  const related: ClusterResourceLink[] = []

  for (const authored of authoredLinks) {
    const resolved = resourcesByPath.get(authored.href)
    if (!resolved || seenPaths.has(resolved.canonicalPath) || related.length >= CLUSTER_RELATED_LINK_LIMIT) continue
    seenPaths.add(resolved.canonicalPath)
    related.push({ ...resolved, source: "authored" })
  }

  const derivedIds = memberships.flatMap(getTopicMemberIds)
  const derivedPriority = new Map<string, number>()
  for (const id of derivedIds) {
    if (!derivedPriority.has(id)) derivedPriority.set(id, derivedPriority.size)
  }

  const derived = derivedIds
    .map((id) => resourcesById.get(id))
    .filter((item): item is ClusterResourceLink => item !== undefined && item.type !== current.type)
    .toSorted((left, right) => typeOrder[left.type as Exclude<ClusterResourceType, "topic">] - typeOrder[right.type as Exclude<ClusterResourceType, "topic">] || (derivedPriority.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (derivedPriority.get(right.id) ?? Number.MAX_SAFE_INTEGER) || left.canonicalPath.localeCompare(right.canonicalPath, "en-IN"))

  const typeCounts = new Map<ClusterResourceType, number>()
  for (const item of related) typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1)
  for (const candidate of derived) {
    const typeLimit = candidate.type === "glossary" ? 2 : 1
    if (related.length >= CLUSTER_RELATED_LINK_LIMIT || seenPaths.has(candidate.canonicalPath) || (typeCounts.get(candidate.type) ?? 0) >= typeLimit) continue
    seenPaths.add(candidate.canonicalPath)
    typeCounts.set(candidate.type, (typeCounts.get(candidate.type) ?? 0) + 1)
    related.push(candidate)
  }

  const topics = memberships.map(({ definition }) => ({
    id: definition.id, type: "topic" as const, title: definition.name, description: definition.description,
    canonicalPath: definition.canonicalPath, source: "topic" as const,
  }))
  return { topics, related }
}

export function getTopicLearningPath(topic: ResolvedTopic): readonly TopicLearningPathStep[] {
  const resources = getPublicResourceLinks()
  const memberIds = new Set(getTopicMemberIds(topic))
  const resourcesById = new Map(resources.filter((item) => memberIds.has(item.id)).map((item) => [item.id, item]))
  return topic.definition.startHere.map((step) => {
    const destination = resourcesById.get(step.resourceId)
    if (!destination) throw new Error(`Topic ${topic.definition.id} has an invalid learning-path resource: ${step.resourceId}`)
    return { title: step.title, description: step.description, destination }
  })
}
