type CalculatorSliderInputProps = {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly onValueChange: (value: number) => void
  readonly output: string
  readonly min: number
  readonly max: number
  readonly step: number
}

export function CalculatorSliderInput({ id, label, value, onValueChange, output, min, max, step }: CalculatorSliderInputProps) {
  return (
    <div className="mt-2">
      <div className="mb-1.5 flex justify-between text-[13px]">
        <label htmlFor={id} className="font-medium text-muted-foreground">{label}</label>
        <output htmlFor={id} className="font-mono font-semibold">{output}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer accent-money"
      />
    </div>
  )
}
