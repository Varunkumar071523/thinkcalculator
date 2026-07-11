import type { CalculatorSectionProps } from "@/features/calculators/core/calculator-types"
import { cn } from "@/lib/utils"

export function CalculatorSection({
  id,
  title,
  description,
  children,
  className,
}: CalculatorSectionProps) {
  const headingId = id ? `${id}-heading` : undefined

  return (
    <section className={cn("scroll-mt-24", className)} id={id} aria-labelledby={headingId}>
      <div className="max-w-3xl">
        <h2 id={headingId} className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-3 leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}
