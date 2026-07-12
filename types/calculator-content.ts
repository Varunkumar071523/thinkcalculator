export type CalculatorContentSectionType = "overview" | "how-it-works" | "input-guide" | "interpretation" | "benefits" | "limitations" | "common-mistakes" | "practical-tips" | "comparison" | "references"

export type CalculatorContentParagraph = { readonly type: "paragraph"; readonly text: string }
export type CalculatorContentList = { readonly type: "list"; readonly style: "bullet" | "numbered"; readonly items: readonly string[] }
export type CalculatorContentTable = { readonly type: "table"; readonly caption: string; readonly headers: readonly string[]; readonly rows: readonly (readonly string[])[] }
export type CalculatorContentCallout = { readonly type: "callout"; readonly variant: "note" | "tip" | "warning" | "important"; readonly title: string; readonly text: string }
export type CalculatorContentComparison = CalculatorContentTable & { readonly type: "table" }
export type CalculatorContentReference = { readonly title: string; readonly organization?: string; readonly url?: string }
export type CalculatorContentBlock = CalculatorContentParagraph | CalculatorContentList | CalculatorContentTable | CalculatorContentCallout
export type CalculatorContentSection = { readonly id: string; readonly title: string; readonly type: CalculatorContentSectionType; readonly content: readonly CalculatorContentBlock[] }
export type CalculatorTableOfContentsItem = { readonly id: string; readonly title: string }
export type CalculatorLearningLink = { readonly title: string; readonly description: string; readonly href: string }
export type CalculatorKnowledgeContent = { readonly title: string; readonly description: string; readonly sections: readonly CalculatorContentSection[]; readonly relatedLinks: readonly CalculatorLearningLink[]; readonly references?: readonly CalculatorContentReference[] }
