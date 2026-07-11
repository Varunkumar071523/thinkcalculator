import type { ReactNode } from "react"

import type {
  CalculatorDefinition,
  CalculatorResultItem,
} from "@/types/calculator"

export type CalculatorPageLayoutProps = {
  readonly calculator: CalculatorDefinition
  readonly form: ReactNode
  readonly result: ReactNode
  readonly children?: ReactNode
}

export type CalculatorShellProps = {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
}

export type CalculatorResultCardProps = {
  readonly title?: string
  readonly items?: readonly CalculatorResultItem[]
  readonly emptyTitle?: string
  readonly emptyDescription?: string
}

export type CalculatorSectionProps = {
  readonly id?: string
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly className?: string
}

export type {
  CalculatorCategory,
  CalculatorDefinition,
  CalculatorFAQ,
  CalculatorFormula,
  CalculatorInputDefinition,
  CalculatorMetadata,
  CalculatorResultItem,
  CalculatorSelectOption,
  CalculatorWorkedExample,
  RelatedCalculator,
} from "@/types/calculator"
