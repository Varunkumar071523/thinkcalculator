export type GratuityOfficialSource = Readonly<{
  id: "code" | "commencement" | "rules" | "faqs" | "additional-faqs" | "ceiling"
  title: string
  issuingAuthority: string
  url: string
  publicationOrEffectiveDate: string
  checkedOn: string
  ruleUsed: string
}>

export const GRATUITY_STATUTORY_CEILING = 2_000_000
export const GRATUITY_ORDINARY_SERVICE_YEARS = 5
export const GRATUITY_REGULATORY_REVIEW_DATE = "2026-07-13"

export const GRATUITY_OFFICIAL_SOURCES: readonly GratuityOfficialSource[] = [
  {
    id: "code",
    title: "Code on Social Security, 2020",
    issuingAuthority: "Ministry of Labour and Employment, Government of India",
    url: "https://www.labour.gov.in/static/uploads/2025/07/b0620548445580767b5c0d18c95c26f7.pdf",
    publicationOrEffectiveDate: "Enacted 2020-09-28; relevant provisions effective from 2025-11-21",
    checkedOn: GRATUITY_REGULATORY_REVIEW_DATE,
    ruleUsed: "Section 2(88) wage definition and section 53 gratuity events, 15-day rate, service fraction above six months, special cases, ceiling authority, better terms, forfeiture provisions, and the monthly-rated 26-day divisor.",
  },
  {
    id: "commencement",
    title: "S.O. 5319(E): commencement notification for the Code on Social Security, 2020",
    issuingAuthority: "Ministry of Labour and Employment, Government of India",
    url: "https://labour.gov.in/sites/default/files/e-_noti-ss_0.pdf",
    publicationOrEffectiveDate: "2025-11-21",
    checkedOn: GRATUITY_REGULATORY_REVIEW_DATE,
    ruleUsed: "Brings the relevant Code provisions into force from 21 November 2025, subject to the official corrigendum and staged commencement record.",
  },
  {
    id: "rules",
    title: "Social Security (Central) Rules, 2026 (G.S.R. 344(E))",
    issuingAuthority: "Ministry of Labour and Employment, Government of India",
    url: "https://www.labour.gov.in/static/uploads/2026/05/49aa9b62c2125499c37399b90e969d67.pdf",
    publicationOrEffectiveDate: "Published and effective 2026-05-08",
    checkedOn: GRATUITY_REGULATORY_REVIEW_DATE,
    ruleUsed: "Current Central procedural rules under the Code, including gratuity applications and fixed-term treatment; they do not expand this calculator beyond the standard regular monthly rated formula.",
  },
  {
    id: "faqs",
    title: "FAQs on Labour Codes dated 30 December 2025",
    issuingAuthority: "Ministry of Labour and Employment, Government of India",
    url: "https://www.labour.gov.in/static/uploads/2026/01/de4758d5bfeffc456d7de97a801891b0.pdf",
    publicationOrEffectiveDate: "2025-12-30",
    checkedOn: GRATUITY_REGULATORY_REVIEW_DATE,
    ruleUsed: "Confirms the ordinary five-year rule, qualified exceptions, the part-year rule, special employee calculations, better terms, and the current Rs 20 lakh maximum.",
  },
  {
    id: "additional-faqs",
    title: "Additional FAQs on Labour Codes as on 16 March 2026",
    issuingAuthority: "Ministry of Labour and Employment, Government of India",
    url: "https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf",
    publicationOrEffectiveDate: "2026-03-16",
    checkedOn: GRATUITY_REGULATORY_REVIEW_DATE,
    ruleUsed: "Confirms the 21 November 2025 wage-definition basis, prospective calculation position, section 2(88) component boundary, fixed-term clarification, and treatment of pre-commencement service at the last-drawn wage when gratuity becomes payable after commencement.",
  },
  {
    id: "ceiling",
    title: "S.O. 1420(E): Rs 20 lakh ceiling under the Payment of Gratuity Act, 1972",
    issuingAuthority: "Ministry of Labour and Employment, Government of India",
    url: "https://labour.gov.in/sites/default/files/184299.pdf",
    publicationOrEffectiveDate: "2018-03-29; continued current ceiling confirmed by 2025 official FAQs",
    checkedOn: GRATUITY_REGULATORY_REVIEW_DATE,
    ruleUsed: "Originally notified Rs 20 lakh under the 1972 Act; section 164(2)(a) of the Code continues non-conflicting prior notifications under corresponding Code provisions, and the December 2025 Ministry FAQs expressly confirm that the current maximum is Rs 20 lakh.",
  },
] as const
