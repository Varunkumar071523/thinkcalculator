export type ClusterResourceType = "calculator" | "blog" | "guide" | "glossary" | "topic"
export type ClusterLinkSource = "authored" | "topic"

export type ClusterResourceLink = Readonly<{
  id: string
  type: ClusterResourceType
  title: string
  description: string
  canonicalPath: string
  source: ClusterLinkSource
}>

export type ClusterNavigation = Readonly<{
  topics: readonly ClusterResourceLink[]
  related: readonly ClusterResourceLink[]
}>

export type TopicLearningPathStep = Readonly<{
  title: string
  description: string
  destination: ClusterResourceLink
}>
