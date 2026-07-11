"use client"

import { useState, type FormEvent } from "react"

import { CalculatorNumberInput } from "@/components/calculators/calculator-number-input"
import { CalculatorSelectInput } from "@/components/calculators/calculator-select-input"
import { Button } from "@/components/ui/button"
import { CalculatorResultCard } from "@/features/calculators/core/calculator-result-card"
import { CalculatorShell } from "@/features/calculators/core/calculator-shell"
import type { CalculatorResultItem } from "@/types/calculator"

const demonstrationResults: readonly CalculatorResultItem[] = [
  {
    id: "demonstration-value",
    label: "Demonstration value",
    value: 124000,
    displayType: "currency",
    description: "A predefined value used only to preview the result design.",
    isPrimary: true,
  },
  { id: "sample-rate", label: "Sample rate", value: 8, displayType: "percentage" },
  { id: "sample-count", label: "Sample periods", value: 3, displayType: "number" },
  { id: "result-status", label: "Result type", value: "Static demo", displayType: "text" },
]

export function DemoCalculator() {
  const [amount, setAmount] = useState("100000")
  const [rate, setRate] = useState("8")
  const [duration, setDuration] = useState("3")
  const [showResult, setShowResult] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowResult(true)
  }

  return (
    <>
      <CalculatorShell title="Try the framework" description="These values do not affect the predefined demonstration result.">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <CalculatorNumberInput id="sample-amount" label="Sample amount" description="Enter any demonstration amount." prefix="₹" min={0} step={100} value={amount} onValueChange={setAmount} required />
          <CalculatorNumberInput id="sample-rate" label="Sample rate" description="Enter a sample percentage rate." suffix="%" min={0} max={100} step={0.1} value={rate} onValueChange={setRate} required />
          <CalculatorSelectInput id="sample-duration" label="Sample duration" description="Choose a demonstration duration." value={duration} onValueChange={setDuration} options={[{ label: "1 year", value: "1" }, { label: "3 years", value: "3" }, { label: "5 years", value: "5" }]} required />
          <Button className="w-full" size="lg" type="submit">Show demonstration result</Button>
        </form>
      </CalculatorShell>
      <CalculatorResultCard items={showResult ? demonstrationResults : []} />
    </>
  )
}
