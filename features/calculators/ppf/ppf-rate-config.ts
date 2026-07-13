import { PPF_OFFICIAL_SOURCES } from "./ppf-official-sources"

export type PPFRateConfiguration = Readonly<{
  defaultRate: number
  label: string
  effectiveFrom: string
  verifiedPeriod: string
  checkedOn: string
  sourceTitle: string
  issuingAuthority: string
  sourceUrl: string
  verificationNote: string
  maintenanceNote: string
}>

export const PPF_RATE_CONFIG: PPFRateConfiguration = {
  defaultRate: 7.1,
  label: "Reference projection rate",
  effectiveFrom: "2020-04-01",
  verifiedPeriod: "Deposits and balances on or after 1 April 2020 in the NSI scheme text",
  checkedOn: "2026-07-13",
  sourceTitle: PPF_OFFICIAL_SOURCES[1].title,
  issuingAuthority: PPF_OFFICIAL_SOURCES[1].issuingAuthority,
  sourceUrl: PPF_OFFICIAL_SOURCES[1].url,
  verificationNote: "The DEA notification published on 30 March 2026 was accessible, but its rate table was not text-verifiable during review. This is therefore a reference default supported by the NSI scheme amendment, not a claim that 7.1% is the current rate.",
  maintenanceNote: "For a new official small-savings notification, inspect the PPF row and effective quarter, update this object's default, effective basis, checked date, title, authority, and URL together, then review visible input/result copy, worked examples, official-source records, documentation, URL defaults, and tests before rerunning the full quality gate.",
}
