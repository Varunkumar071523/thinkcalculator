import type { ReactNode } from "react"

type CalculatorFieldProps = {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly error?: string
  readonly required?: boolean
  readonly children: ReactNode
}

export function CalculatorField({
  id,
  label,
  description,
  error,
  required,
  children,
}: CalculatorFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
      </label>
      {description ? <p id={`${id}-description`} className="text-sm leading-5 text-muted-foreground">{description}</p> : null}
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
