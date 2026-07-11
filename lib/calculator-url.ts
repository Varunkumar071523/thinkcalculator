export function buildCalculatorUrl(
  pathname: string,
  parameters: Readonly<Record<string, string>>,
  origin?: string,
): string {
  const search = new URLSearchParams(parameters).toString()
  const path = search ? `${pathname}?${search}` : pathname
  return origin ? new URL(path, origin).toString() : path
}
