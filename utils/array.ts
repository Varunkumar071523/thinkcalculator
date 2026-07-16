/**
 * Reverse-iteration replacement for `Array.prototype.findLast` (ES2023, Safari 15.4+ / Node 18+).
 * Written out explicitly rather than relying on the native method so calculation code does not
 * depend on a relatively recent runtime feature.
 */
export function findLastMatching<T>(items: readonly T[], predicate: (item: T) => boolean): T | undefined {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) return items[index]
  }
  return undefined
}
