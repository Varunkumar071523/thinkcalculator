const indianNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
})

const indianCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value)
}

export function formatIndianCurrency(value: number): string {
  return isFiniteNumber(value) ? indianCurrencyFormatter.format(value) : "—"
}

export function formatIndianNumber(value: number): string {
  return isFiniteNumber(value) ? indianNumberFormatter.format(value) : "—"
}

export function formatPercentage(value: number): string {
  return isFiniteNumber(value) ? `${indianNumberFormatter.format(value)}%` : "—"
}
