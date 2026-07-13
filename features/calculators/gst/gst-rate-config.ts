export type GSTOfficialSource = Readonly<{
  id: "rates" | "rate-examples" | "tax-heads" | "invoice-terminology"
  title: string
  issuingAuthority: string
  url: string
  checkedOn: string
  claimSupported: string
}>

export type GSTRatePreset = Readonly<{
  value: number
  label: string
  kind: "calculation-option" | "common-schedule-preset"
}>

export const GST_RATE_CONFIG = {
  defaultRate: 18,
  minimumRate: 0,
  maximumRate: 100,
  checkedOn: "2026-07-13",
  presets: [
    { value: 0, label: "0%", kind: "calculation-option" },
    { value: 5, label: "5%", kind: "common-schedule-preset" },
    { value: 12, label: "12%", kind: "common-schedule-preset" },
    { value: 18, label: "18%", kind: "common-schedule-preset" },
    { value: 28, label: "28%", kind: "common-schedule-preset" },
  ] satisfies readonly GSTRatePreset[],
  applicabilityNotice: "Presets are arithmetic shortcuts, not rate recommendations. Actual applicability depends on current classification, notification, place-of-supply rules, and transaction facts. Verify the applicable rate from official sources or a qualified professional.",
  sources: [
    {
      id: "rates",
      title: "GST Goods and Services Rates",
      issuingAuthority: "Central Board of Indirect Taxes and Customs, Government of India",
      url: "https://cbic-gst.gov.in/gst-goods-services-rates.html",
      checkedOn: "2026-07-13",
      claimSupported: "CBIC provides an official route to GST rate schedules. This route does not determine the correct classification for a user's supply.",
    },
    {
      id: "rate-examples",
      title: "GST Rates FAQs",
      issuingAuthority: "Central Board of Indirect Taxes and Customs, Government of India",
      url: "https://cbic-gst.gov.in/gst-rates-faq.html",
      checkedOn: "2026-07-13",
      claimSupported: "The official FAQ contains classified examples using 5%, 12%, 18%, and 28%. These examples support the represented arithmetic presets but do not classify a user's supply.",
    },
    {
      id: "tax-heads",
      title: "Frequently Asked Questions",
      issuingAuthority: "Central Board of Indirect Taxes and Customs, Government of India",
      url: "https://cbic-gst.gov.in/faq.html",
      checkedOn: "2026-07-13",
      claimSupported: "Where supplier location and place of supply are in the same State, CGST and SGST apply; the FAQ also describes IGST for inter-State supplies and CGST plus UTGST for supplies within a Union Territory.",
    },
    {
      id: "invoice-terminology",
      title: "GSTR-1 User Guide",
      issuingAuthority: "Goods and Services Tax Portal, Government of India",
      url: "https://tutorial.gst.gov.in/userguide/returns/GSTR_1.htm",
      checkedOn: "2026-07-13",
      claimSupported: "The guide describes total invoice value as inclusive of taxes and uses taxable value, invoice value, and tax amount as distinct fields; it notes declared values use up to two decimal digits.",
    },
  ] satisfies readonly GSTOfficialSource[],
} as const

export function getGSTRatePreset(rate: number): GSTRatePreset | undefined {
  return GST_RATE_CONFIG.presets.find((preset) => preset.value === rate)
}
