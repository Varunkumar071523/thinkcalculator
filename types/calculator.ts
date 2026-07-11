export type CalculatorCategory =
  | "Finance"
  | "Business"
  | "Health"
  | "Education"
  | "Utility"

export type CalculatorStatus = "draft" | "published"

export type CalculatorMetadata = {
  readonly title: string
  readonly description: string
  readonly keywords?: readonly string[]
}

export type CalculatorSelectOption = {
  readonly label: string
  readonly value: string
}

type CalculatorInputBase = {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly required?: boolean
}

export type CalculatorNumberInputDefinition = CalculatorInputBase & {
  readonly type: "number"
  readonly placeholder?: string
  readonly prefix?: string
  readonly suffix?: string
  readonly min?: number
  readonly max?: number
  readonly step?: number
}

export type CalculatorSelectInputDefinition = CalculatorInputBase & {
  readonly type: "select"
  readonly options: readonly CalculatorSelectOption[]
}

export type CalculatorInputDefinition =
  | CalculatorNumberInputDefinition
  | CalculatorSelectInputDefinition

export type CalculatorResultDisplayType =
  | "currency"
  | "percentage"
  | "number"
  | "text"

export type CalculatorResultItem = {
  readonly id: string
  readonly label: string
  readonly value: number | string
  readonly displayType: CalculatorResultDisplayType
  readonly description?: string
  readonly isPrimary?: boolean
}

export type CalculatorFormulaVariable = {
  readonly symbol: string
  readonly meaning: string
}

export type CalculatorFormula = {
  readonly title?: string
  readonly expression: string
  readonly description: string
  readonly variables?: readonly CalculatorFormulaVariable[]
}

export type CalculatorWorkedExampleValue = {
  readonly label: string
  readonly value: string
}

export type CalculatorWorkedExample = {
  readonly title?: string
  readonly description: string
  readonly inputs: readonly CalculatorWorkedExampleValue[]
  readonly results: readonly CalculatorWorkedExampleValue[]
}

export type CalculatorFAQ = {
  readonly question: string
  readonly answer: string
}

export type RelatedCalculator = {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly href: string
  readonly category: CalculatorCategory
}

export type CalculatorDefinition = {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly shortTitle: string
  readonly description: string
  readonly category: CalculatorCategory
  readonly canonicalPath: string
  readonly inputs: readonly CalculatorInputDefinition[]
  readonly formula?: CalculatorFormula
  readonly workedExample?: CalculatorWorkedExample
  readonly faqs: readonly CalculatorFAQ[]
  readonly relatedCalculators: readonly RelatedCalculator[]
  readonly metadata: CalculatorMetadata
  readonly status: CalculatorStatus
}
