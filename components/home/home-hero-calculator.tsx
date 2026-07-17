"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { CalculatorSliderInput } from "@/components/calculators/calculator-slider-input"
import { calculateEMI } from "@/features/calculators/emi/calculate-emi"
import { buildEMICalculatorUrl } from "@/features/calculators/emi/emi-url-state"
import { formatIndianCurrency } from "@/lib/formatters"

const PRINCIPAL_MIN = 100_000
const PRINCIPAL_MAX = 10_000_000
const RATE_MIN = 5
const RATE_MAX = 15
const TENURE_MIN = 1
const TENURE_MAX = 30

export function HomeHeroCalculator() {
  const [principal, setPrincipal] = useState(2_500_000)
  const [rate, setRate] = useState(8.5)
  const [tenure, setTenure] = useState(20)

  const result = useMemo(
    () => calculateEMI({ principalAmount: principal, annualInterestRate: rate, tenure, tenureUnit: "years" }),
    [principal, rate, tenure],
  )
  const breakdownUrl = useMemo(
    () => buildEMICalculatorUrl({ principalAmount: principal, annualInterestRate: rate, tenure, tenureUnit: "years" }),
    [principal, rate, tenure],
  )

  return (
    <div className="rounded-xl border border-line bg-card p-6 shadow-[0_1px_2px_rgba(20,20,10,0.03),0_12px_32px_-18px_rgba(20,20,10,0.18)]">
      <div className="mb-4.5 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Quick EMI check</h2>
        <span className="font-mono text-[11px] text-muted-foreground">Try it — no signup</span>
      </div>

      <CalculatorSliderInput
        id="hero-principal"
        label="Loan amount"
        output={formatIndianCurrency(principal)}
        min={PRINCIPAL_MIN}
        max={PRINCIPAL_MAX}
        step={50_000}
        value={principal}
        onValueChange={setPrincipal}
      />
      <CalculatorSliderInput
        id="hero-rate"
        label="Interest rate (p.a.)"
        output={`${rate.toFixed(1)}%`}
        min={RATE_MIN}
        max={RATE_MAX}
        step={0.1}
        value={rate}
        onValueChange={setRate}
      />
      <CalculatorSliderInput
        id="hero-tenure"
        label="Tenure"
        output={`${tenure} years`}
        min={TENURE_MIN}
        max={TENURE_MAX}
        step={1}
        value={tenure}
        onValueChange={setTenure}
      />

      <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-money-soft p-4.5">
        <div>
          <p className="mb-1 text-[12.5px] text-muted-foreground">Monthly EMI</p>
          <p className="font-mono text-2xl font-semibold text-money">{formatIndianCurrency(result.monthlyEMI)}</p>
        </div>
        <Link href={breakdownUrl} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-money hover:underline">
          Full breakdown <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
