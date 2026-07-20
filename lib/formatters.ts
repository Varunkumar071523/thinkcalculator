const indianNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
})

const indianCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
})

const indianDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
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

/** Formats an ISO `YYYY-MM-DD` date string (e.g. changelog entry dates) for display. */
export function formatIsoDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? "—" : indianDateFormatter.format(date)
}
