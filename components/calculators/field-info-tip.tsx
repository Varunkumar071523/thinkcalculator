"use client"

import { useState } from "react"

import { Popover } from "@base-ui/react/popover"
import { Info } from "lucide-react"

type FieldInfoTipProps = {
  readonly label: string
  readonly description: string
  readonly descriptionId: string
}

/** A focusable info icon that reveals a field's helper text in a popover on hover, keyboard focus,
 * or tap (mobile has no hover, so tap-to-open must work too). Uses Popover rather than Tooltip per
 * Base UI's own guidance: an info-icon disclosure is a popover (`openOnHover`), not a tooltip,
 * because tooltips are unreachable for touch/screen-reader users. `openOnHover` alone only wires up
 * hover and click, though — Base UI's Popover.Trigger has no `openOnFocus` prop, so plain keyboard
 * Tab focus (verified with a real Playwright Tab traversal, not a synthetic `.focus()` call, since
 * `.focus()` doesn't reliably match `:focus-visible`) left it closed. The popover is made
 * open/onOpenChange-controlled here specifically to add that missing case back via onFocus.
 *
 * onFocus only opens when the focus is `:focus-visible` (i.e. keyboard-driven), not on every focus.
 * Verified with debug instrumentation that clicking the trigger also fires a plain `focus` event in
 * Chromium (mousedown → focus → click): an unconditional `setOpen(true)` in onFocus raced Base UI's
 * own click-driven open/close toggle — since our `open` prop had already flipped true by the time
 * onClick's toggle logic ran, click "opening" it instead read it as already-open and closed it,
 * so a single click looked like a no-op and it only actually opened on the second click. Gating on
 * `:focus-visible` fixes this at the source: a mouse click's resulting focus never matches
 * `:focus-visible` in Chromium/Firefox, so onFocus no-ops for it and only Base UI's own
 * click-toggle acts, while a real Tab keypress does match and opens it as intended.
 *
 * `Popover.Popup`'s `initialFocus={false}` keeps DOM focus on the trigger icon itself when opened
 * via keyboard, instead of Base UI's default of moving focus into the popup panel. Without this,
 * tabbing to the icon opened the popover but then immediately handed focus to the (non-modal, purely
 * informational) popup content, which both fired a `blur` on the trigger a moment after its own
 * `focus` — ruling out a matching onBlur-close, since that would close the popover the instant it
 * opened — and, worse, broke `tests/e2e/keyboard.spec.ts`'s form-control Tab-traversal count: that
 * test's own focus check runs a tick after each Tab press and only credits a control if
 * `document.activeElement` is still inside `[data-calculator-form]` at that point, so with focus
 * already handed off to the popup (portaled outside the form), the icon's own visit was never
 * observed and 3 of 15 controls silently went uncounted. `initialFocus={false}` avoids the handoff
 * entirely: the icon stays focused, the popup is purely a visual disclosure of the same content
 * `aria-describedby` already exposes, and outside-press/escape-key/focus-out closing (verified via
 * Playwright: Tab away from the icon closes it; Escape closes it) is left to Base UI's own
 * `onOpenChange` rather than reimplemented with a manual onBlur. `descriptionId` is the id of a
 * screen-reader-only node (rendered by CalculatorField) that holds this same text at all times — so
 * `aria-describedby` keeps working for assistive tech regardless of whether the popover is open,
 * instead of depending on hover/focus state. */
export function FieldInfoTip({ label, description, descriptionId }: FieldInfoTipProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        openOnHover
        delay={200}
        onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setOpen(true) }}
        aria-label={`More info: ${label}`}
        aria-describedby={descriptionId}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className="z-50 max-w-[calc(100vw-2rem)]">
          <Popover.Popup
            initialFocus={false}
            className="w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-popover px-3 py-2 text-sm leading-5 text-popover-foreground shadow-md"
          >
            {description}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
