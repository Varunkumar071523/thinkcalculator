import { CalculatorField, getCalculatorFieldDescriptionIds } from "@/components/calculators/calculator-field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type CalculatorNumberInputProps = {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onValueChange: (value: string) => void
  readonly description?: string
  readonly prefix?: string
  readonly suffix?: string
  readonly placeholder?: string
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly error?: string
  readonly required?: boolean
  readonly disabled?: boolean
  readonly helperTextVariant?: "inline" | "tooltip"
}

export function CalculatorNumberInput({
  id,
  label,
  value,
  onValueChange,
  description,
  prefix,
  suffix,
  placeholder,
  min,
  max,
  step,
  error,
  required,
  disabled,
  helperTextVariant,
}: CalculatorNumberInputProps) {
  const describedBy = getCalculatorFieldDescriptionIds(id, Boolean(description), Boolean(error))

  return (
    <CalculatorField id={id} label={label} description={description} error={error} required={required} helperTextVariant={helperTextVariant}>
      <div className="relative">
        {prefix ? <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">{prefix}</span> : null}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("h-10", prefix && "pl-8", suffix && "pr-10")}
        />
        {suffix ? <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">{suffix}</span> : null}
      </div>
    </CalculatorField>
  )
}
