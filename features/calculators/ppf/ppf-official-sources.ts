export type PPFOfficialSource = Readonly<{
  id: "scheme-pdf" | "nsi-scheme" | "dea-rates"
  title: string
  issuingAuthority: string
  url: string
  publicationOrEffectiveDate: string
  ruleUsed: string
  checkedOn: string
}>

export const PPF_OFFICIAL_SOURCES: readonly PPFOfficialSource[] = [
  {
    id: "scheme-pdf",
    title: "Public Provident Fund Scheme, 2019",
    issuingAuthority: "Government of India, Ministry of Finance (Gazette copy hosted by Department of Posts)",
    url: "https://www.indiapost.gov.in/documents/offerings/schemesandservices/posb/PublicProvidentFundScheme2019English.pdf",
    publicationOrEffectiveDate: "2019-12-12",
    ruleUsed: "Annual ₹500 minimum, ₹1,50,000 maximum, ₹50 multiples, lump-sum or instalment deposits, monthly lowest-balance interest eligibility, year-end interest credit, closure after fifteen years from the end of the opening financial year, and five-year extension blocks subject to the scheme procedure.",
    checkedOn: "2026-07-13",
  },
  {
    id: "nsi-scheme",
    title: "Public Provident Fund Scheme, 2019 (including G.S.R. 290(E) amendment)",
    issuingAuthority: "National Savings Institute, Ministry of Finance, Government of India",
    url: "https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=169",
    publicationOrEffectiveDate: "Amendment dated 2020-05-05; reference rate applies on or after 2020-04-01",
    ruleUsed: "Reference-rate basis, monthly lowest-balance rule, year-end crediting, and scheme tenure/extension text.",
    checkedOn: "2026-07-13",
  },
  {
    id: "dea-rates",
    title: "Revision of Intereset rates for Small Savings Schemes-reg.",
    issuingAuthority: "Department of Economic Affairs, Ministry of Finance, Government of India",
    url: "https://dea.gov.in/files/budget_division_documents/RoI_Q1_2627.pdf",
    publicationOrEffectiveDate: "Published 2026-03-30 for April-June 2026",
    ruleUsed: "Used only to record the accessible official quarterly-notification document. Its rate table was not text-verifiable during review, so no rate or continuation claim is inferred from its contents.",
    checkedOn: "2026-07-13",
  },
] as const
