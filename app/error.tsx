"use client"

import Link from "next/link"
import { CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ErrorPage({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <section className="mx-auto max-w-2xl px-4 py-20 text-center" aria-labelledby="error-heading"><CircleAlert className="mx-auto size-12 text-muted-foreground" aria-hidden="true" /><h1 id="error-heading" className="mt-5 text-3xl font-semibold tracking-tight">Something went wrong</h1><p className="mt-4 leading-7 text-muted-foreground">We could not display this page. You can try again or return to the homepage.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button type="button" onClick={() => unstable_retry()}>Try again</Button><Button variant="outline" nativeButton={false} render={<Link href="/" />}>Go to homepage</Button></div></section>
}
