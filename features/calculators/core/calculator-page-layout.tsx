import { SiteContainer } from "@/components/layout/site-container"
import { Badge } from "@/components/ui/badge"
import { ClusterNavigation } from "@/components/topics/cluster-navigation"
import { CalculatorBreadcrumbs } from "@/features/calculators/core/calculator-breadcrumbs"
import type { CalculatorPageLayoutProps } from "@/features/calculators/core/calculator-types"

export function CalculatorPageLayout({ calculator, form, result, children }: CalculatorPageLayoutProps) {
  return (
    <SiteContainer className="py-8 sm:py-12">
      <CalculatorBreadcrumbs category={calculator.category} calculatorTitle={calculator.shortTitle} />
      <header className="mt-8 max-w-3xl">
        <Badge variant="secondary">{calculator.category}</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{calculator.title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{calculator.description}</p>
      </header>
      <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        {form}
        {result ? <aside aria-label="Calculator results">{result}</aside> : null}
      </div>
      {children ? <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">{children}</div> : null}
      <ClusterNavigation resourceId={calculator.id} className="mt-16 sm:mt-20" />
    </SiteContainer>
  )
}
