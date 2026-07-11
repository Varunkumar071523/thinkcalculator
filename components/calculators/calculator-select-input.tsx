import { CalculatorField, getCalculatorFieldDescriptionIds } from "@/components/calculators/calculator-field"
import type { CalculatorSelectOption } from "@/types/calculator"

type CalculatorSelectInputProps = {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly options: readonly CalculatorSelectOption[]
  readonly description?: string
  readonly error?: string
  readonly required?: boolean
  readonly disabled?: boolean
}

export function CalculatorSelectInput({
  id,
  label,
  value,
  onValueChange,
  options,
  description,
  error,
  required,
  disabled,
}: CalculatorSelectInputProps) {
  const describedBy = getCalculatorFieldDescriptionIds(id, Boolean(description), Boolean(error))

  return (
    <CalculatorField id={id} label={label} description={description} error={error} required={required}>
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive"
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </CalculatorField>
  )
}
