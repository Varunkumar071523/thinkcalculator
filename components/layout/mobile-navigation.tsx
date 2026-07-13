"use client"

import Link from "next/link"
import { Menu, Search } from "lucide-react"

import { BrandLogo } from "@/components/shared/brand-logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { calculatorSearchPath, mainNavigation } from "@/lib/site-config"

export function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}>
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent className="w-full max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle><BrandLogo /></SheetTitle>
          <SheetDescription>Navigate ThinkCalculator</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label="Mobile navigation">
          {mainNavigation.map((item) => (
            <SheetClose key={item.href} nativeButton={false} render={<Link href={item.href} className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
              {item.title}
            </SheetClose>
          ))}
          <SheetClose nativeButton={false} render={<Link href={calculatorSearchPath} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
            <Search className="size-4" aria-hidden="true" /> Search calculators
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
