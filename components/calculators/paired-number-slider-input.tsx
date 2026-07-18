import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"

type PairedNumberSliderInputProps = {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly sliderValue: number
  readonly onValueChange: (value: string) => void
  readonly description?: string
  readonly prefix?: string
  readonly suffix?: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly sliderMin?: number
  readonly sliderMax?: number
  readonly error?: string
  readonly required?: boolean
  readonly accentClassName?: string
}

/** A number input and a range slider bound to the same value, editable from either control —
 * used across calculators that let a visitor drag or type a principal, rate, or duration. */
export function PairedNumberSliderInput({
  id,
  label,
  value,
  sliderValue,
  onValueChange,
  description,
  prefix,
  suffix,
  min,
  max,
  step,
  sliderMin,
  sliderMax,
  error,
  required,
  accentClassName = "accent-primary",
}: PairedNumberSliderInputProps) {
  return (
    <div>
      <CalculatorNumberInput
        id={id}
        label={label}
        description={description}
        prefix={prefix}
        suffix={suffix}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        error={error}
        required={required}
      />
      <input
        type="range"
        aria-label={`${label} slider`}
        min={sliderMin ?? min}
        max={sliderMax ?? max}
        step={step}
        value={sliderValue}
        onChange={(event) => onValueChange(event.target.value)}
        className={`mt-2.5 h-1 w-full cursor-pointer ${accentClassName}`}
      />
    </div>
  )
}
