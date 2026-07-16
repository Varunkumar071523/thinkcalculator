import { describe, expect, it } from "vitest"

import { findLastMatching } from "../array"

describe("findLastMatching", () => {
  it("returns the last matching element", () => {
    expect(findLastMatching([1, 2, 3, 4, 5], (value) => value % 2 === 0)).toBe(4)
  })

  it("returns undefined when nothing matches", () => {
    expect(findLastMatching([1, 3, 5], (value) => value % 2 === 0)).toBeUndefined()
  })

  it("returns undefined for an empty array", () => {
    expect(findLastMatching([], () => true)).toBeUndefined()
  })

  it("matches the last element when the predicate is always true", () => {
    expect(findLastMatching(["a", "b", "c"], () => true)).toBe("c")
  })

  it("produces the same result as the native Array.prototype.findLast", () => {
    const values = [3, 1, 4, 1, 5, 9, 2, 6, 0, 8]
    const predicate = (value: number) => value > 3
    expect(findLastMatching(values, predicate)).toBe(values.findLast(predicate))
  })
})
