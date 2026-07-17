"use client"

import { useEffect, useRef } from "react"

/**
 * Whether a deferred URL-state restore should still apply, given whether the
 * user has already started interacting with the form. Pulled out as a pure,
 * directly testable function — see
 * `__tests__/use-calculator-url-restore.test.ts` — rather than only provable
 * through a rendered component or real browser timing.
 */
export function shouldApplyUrlRestore(hasUserInteracted: boolean): boolean {
  return !hasUserInteracted
}

/**
 * Runs `restore` only if `shouldApplyUrlRestore` allows it. This is the
 * exact function `useCalculatorUrlRestore`'s mount effect calls (see below),
 * pulled out so a test can exercise the real decision-plus-dispatch logic
 * directly — with a plain callback in place of `setState` calls — without
 * mounting a component or controlling a timer.
 */
export function runUrlRestoreIfAllowed(hasUserInteracted: boolean, restore: () => void): void {
  if (shouldApplyUrlRestore(hasUserInteracted)) restore()
}

/**
 * Applies `restore` once, after mount, to bring in any URL-derived (share
 * link or cross-calculator pass-through) form state. Deferred to a
 * client-only effect because `window` is unavailable while this app's pages
 * are statically prerendered — reading `window.location.search` any earlier
 * (e.g. in a `useState` lazy initializer) would make the client's first
 * render disagree with the server-rendered HTML and produce a React
 * hydration warning on every calculator page load.
 *
 * Every calculator previously duplicated this as
 * `useEffect(() => { setTimeout(() => setValues(...), 0) }, [])`. That inner
 * `setTimeout` served no hydration-safety purpose beyond the effect itself
 * (a plain effect already only runs post-hydration) — it only added an
 * artificial extra macrotask of delay. Under real load that delay let a
 * user's own edit to another field land first, and because the restore
 * unconditionally replaced the whole form-values object rather than merging,
 * the user's edit was then silently overwritten by stale defaults with no
 * indication anything happened. Removing the pointless extra delay shrinks
 * that window; the `markUserInteracted` guard closes it, by skipping the
 * restore outright once the user has already touched the form.
 *
 * Returns `markUserInteracted`, which every field-level `onChange`/update
 * handler must call first.
 */
export function useCalculatorUrlRestore(restore: (search: URLSearchParams) => void): () => void {
  const hasInteracted = useRef(false)
  const restoreRef = useRef(restore)

  // Keeps restoreRef current across re-renders (its own effect, run every render, rather than a
  // render-time assignment — writing to a ref during render is not allowed). The mount-restore
  // effect below still only ever fires once; this only protects against it reading a stale
  // closure if a re-render happens to land between the initial render and that first fire.
  useEffect(() => {
    restoreRef.current = restore
  })

  useEffect(() => {
    runUrlRestoreIfAllowed(hasInteracted.current, () => restoreRef.current(new URLSearchParams(window.location.search)))
    // Runs once, on mount, by design — see the doc comment above.
  }, [])

  return function markUserInteracted() {
    hasInteracted.current = true
  }
}
