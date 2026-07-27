"use client"

import { useRef, useState } from "react"
import { Check, Copy, Link as LinkIcon, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildCalculatorEventPayload, trackEvent } from "@/lib/analytics"

type CalculatorActionsProps = {
  readonly resultText: string
  readonly shareUrl: string
  /** Identifies which calculator fired `result_shared` — see
   * features/calculators/core/use-track-calculation.ts for the matching
   * `calculation_completed` event. Never a value the user entered. */
  readonly calculatorType: string
  readonly category: string
}

export function CalculatorActions({ resultText, shareUrl, calculatorType, category }: CalculatorActionsProps) {
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

  function shareLink() {
    trackEvent("result_shared", buildCalculatorEventPayload(calculatorType, category))
    return copy(shareUrl, "Share link copied.")
  }

  return (
    <div className="calculator-actions" data-print-hide>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void copy(resultText, "Results copied.")}><Copy aria-hidden="true" /> Copy results</Button>
        <Button type="button" variant="outline" aria-describedby="share-link-note" onClick={() => void shareLink()}><LinkIcon aria-hidden="true" /> Copy share link</Button>
        <Button type="button" variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" /> Print</Button>
      </div>
      <p id="share-link-note" className="mt-2 text-xs text-muted-foreground">The share link includes the values you entered — anyone with the link can see them.</p>
      <p className="mt-1 min-h-5 text-sm text-muted-foreground" aria-live="polite">{status ? <><Check className="mr-1 inline size-4" aria-hidden="true" />{status}</> : null}</p>
    </div>
  )
}
