import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CalculatorShellProps } from "@/features/calculators/core/calculator-types"

export function CalculatorShell({
  title,
  description,
  children,
}: CalculatorShellProps) {
  return (
    <Card className="h-fit">
      <section aria-labelledby="calculator-form-heading">
        <CardHeader>
          <CardTitle id="calculator-form-heading" className="text-xl">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </section>
    </Card>
  )
}
