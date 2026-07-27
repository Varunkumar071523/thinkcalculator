import type { ReactNode } from "react"

import { FieldInfoTip } from "@/components/calculators/field-info-tip"

type CalculatorFieldProps = {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly error?: string
  readonly required?: boolean
  readonly children: ReactNode
  /** "inline" (default) renders the description as an always-visible paragraph below the label —
   * every existing caller keeps this behavior unless it opts in. "tooltip" instead shows a
   * focusable info icon next to the label that reveals the same text in a popover on hover, focus,
   * or tap, trading vertical space for a hover/tap reveal. The description text stays in the
   * accessibility tree either way via an id'd node referenced by the field's own aria-describedby
   * (wired by callers via getCalculatorFieldDescriptionIds), so screen reader behavior is
   * unaffected by which variant is used. */
  readonly helperTextVariant?: "inline" | "tooltip"
}

export function CalculatorField({
  id,
  label,
  description,
  error,
  required,
  children,
  helperTextVariant = "inline",
}: CalculatorFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const useTooltip = helperTextVariant === "tooltip" && Boolean(description)

  return (
    <div className="space-y-2">
      {useTooltip ? (
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="block text-sm font-medium">
            {label}
            {required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
          </label>
          <FieldInfoTip label={label} description={description!} descriptionId={descriptionId!} />
        </div>
      ) : (
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
          {required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
        </label>
      )}
      {description && !useTooltip ? <p id={descriptionId} className="text-sm leading-5 text-muted-foreground">{description}</p> : null}
      {description && useTooltip ? <span id={descriptionId} className="sr-only">{description}</span> : null}
      {children}
      {error ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  )
}

export function getCalculatorFieldDescriptionIds(
  id: string,
  hasDescription: boolean,
  hasError: boolean,
): string | undefined {
  const ids = [
    hasDescription ? `${id}-description` : null,
    hasError ? `${id}-error` : null,
  ].filter((value): value is string => value !== null)

  return ids.length > 0 ? ids.join(" ") : undefined
}
