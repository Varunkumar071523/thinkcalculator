import Link from "next/link"
import type { GlossaryTextSegment } from "@/features/content/glossary-linker"

export function GlossaryLinkedText({ segments }: { readonly segments: readonly GlossaryTextSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <Link key={`${segment.term.slug}-${index}`} href={segment.term.canonicalPath} className="font-medium text-primary underline-offset-4 hover:underline">
            {segment.text}
          </Link>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}
