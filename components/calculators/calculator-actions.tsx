"use client"

import { useRef, useState } from "react"
import { Check, Copy, Link as LinkIcon, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

type CalculatorActionsProps = {
  readonly resultText: string
  readonly shareUrl: string
}

export function CalculatorActions({ resultText, shareUrl }: CalculatorActionsProps) {
  const [status, setStatus] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function copy(value: string, success: string) {
    try {
      await navigator.clipboard.writeText(value)
      setStatus(success)
    } catch {
      setStatus("Copy failed. Please copy from the address bar instead.")
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(""), 3000)
  }

  return (
    <div className="calculator-actions" data-print-hide>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void copy(resultText, "Results copied.")}><Copy aria-hidden="true" /> Copy results</Button>
        <Button type="button" variant="outline" onClick={() => void copy(shareUrl, "Share link copied.")}><LinkIcon aria-hidden="true" /> Copy share link</Button>
        <Button type="button" variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" /> Print</Button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-muted-foreground" aria-live="polite">{status ? <><Check className="mr-1 inline size-4" aria-hidden="true" />{status}</> : null}</p>
    </div>
  )
}
