import { describe, expect, it, vi } from "vitest"

import { runUrlRestoreIfAllowed, shouldApplyUrlRestore } from "../use-calculator-url-restore"

// This is the exact guard `useCalculatorUrlRestore`'s mount effect checks before applying a
// deferred URL-state restore (see the hook's doc comment for the bug this closes: a user's
// concurrent edit being silently discarded and replaced by stale defaults). Tested as a pure
// function — deterministically, with no timers, DOM, or component rendering — because this
// repository has no component-rendering test infrastructure, and because the guard's correctness
// does not depend on how quickly React happens to schedule the effect; it depends only on this
// boolean decision being right in both directions.
describe("shouldApplyUrlRestore", () => {
  it("applies the restore when the user has not touched the form yet (the ordinary case)", () => {
    expect(shouldApplyUrlRestore(false)).toBe(true)
  })

  it("skips the restore once the user has already interacted, so their edit is never overwritten", () => {
    expect(shouldApplyUrlRestore(true)).toBe(false)
  })
})

// `runUrlRestoreIfAllowed` is the exact function `useCalculatorUrlRestore`'s mount effect calls —
// testing it directly, rather than only `shouldApplyUrlRestore`, proves the dispatch itself is
// correctly gated, not just that the boolean decision is correct in isolation.
describe("runUrlRestoreIfAllowed", () => {
  it("invokes the restore callback when the user has not interacted", () => {
    const restore = vi.fn()
    runUrlRestoreIfAllowed(false, restore)
    expect(restore).toHaveBeenCalledTimes(1)
  })

  it("never invokes the restore callback once the user has interacted", () => {
    const restore = vi.fn()
    runUrlRestoreIfAllowed(true, restore)
    expect(restore).not.toHaveBeenCalled()
  })
})
