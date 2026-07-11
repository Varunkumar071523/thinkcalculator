import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { SiteContainer } from "@/components/layout/site-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PageIntroProps = {
  title: string
  description: string
  sectionTitle?: string
  sectionDescription?: string
}

export function PageIntro({ title, description, sectionTitle = "Tools are on the way", sectionDescription = "We are preparing clear, well-tested resources for this section. Explore the current calculator directory in the meantime." }: PageIntroProps) {
  return (
    <SiteContainer className="py-12 sm:py-20">
      <div className="max-w-3xl">
        <Badge variant="secondary">ThinkCalculator</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
      </div>
      <Card className="mt-10 max-w-3xl bg-muted/30 sm:mt-14">
        <CardHeader><CardTitle className="text-xl">{sectionTitle}</CardTitle></CardHeader>
        <CardContent>
          <p className="leading-7 text-muted-foreground">{sectionDescription}</p>
          <Button className="mt-6" variant="outline" nativeButton={false} render={<Link href="/calculators" />}><ArrowLeft aria-hidden="true" /> Browse calculators</Button>
        </CardContent>
      </Card>
    </SiteContainer>
  )
}
