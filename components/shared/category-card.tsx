import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SiteCategory } from "@/types/site"

export function CategoryCard({ category }: { category: SiteCategory }) {
  const Icon = category.icon
  return (
    <Link href={category.href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors group-hover:bg-muted/40">
        <CardHeader>
          <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
          <CardTitle className="flex items-center justify-between text-lg">{category.title}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></CardTitle>
        </CardHeader>
        <CardContent><p className="leading-6 text-muted-foreground">{category.description}</p></CardContent>
      </Card>
    </Link>
  )
}
