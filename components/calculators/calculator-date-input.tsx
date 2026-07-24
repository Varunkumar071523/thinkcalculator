import { CalculatorField, getCalculatorFieldDescriptionIds } from "@/components/calculators/calculator-field"
import { Input } from "@/components/ui/input"

type CalculatorDateInputProps = {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly description?: string
  readonly min?: string
  readonly max?: string
  readonly error?: string
  readonly required?: boolean
}

/** A native date input following the same CalculatorField/aria-describedby pattern as
 * CalculatorNumberInput and CalculatorSelectInput — this is the site's first calculator input
 * needing a calendar date (purchase/sale dates for capital gains), so it is added as its own
 * small shared primitive rather than a capital-gains-local one-off, mirroring the existing number
 * and select input files exactly rather than introducing a different shape. */
export function CalculatorDateInput({
  id,
  label,
  value,
  onValueChange,
  description,
  min,
  max,
  error,
  required,
}: CalculatorDateInputProps) {
  const describedBy = getCalculatorFieldDescriptionIds(id, Boolean(description), Boolean(error))

  return (
    <CalculatorField id={id} label={label} description={description} error={error} required={required}>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        min={min}
        max={max}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="h-10"
      />
    </CalculatorField>
  )
}
