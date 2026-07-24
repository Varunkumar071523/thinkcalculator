export type CapitalGainsAssetType = "equity-share" | "equity-mutual-fund"

export type CapitalGainsClassification = "stcg" | "ltcg"

export type CapitalGainsLotInput = {
  readonly id: string
  readonly purchaseDate: string
  readonly units: number
  readonly costPerUnit: number
  /** Fair market value per unit as on 31 January 2018 — only meaningful (and required by
   * validation) for a lot whose purchaseDate is before the grandfathering cutoff. `null` for a
   * lot acquired on or after the cutoff, since it plays no part in that lot's cost basis. */
  readonly fairMarketValuePerUnitOn31Jan2018: number | null
}

export type CapitalGainsInput = {
  readonly assetType: CapitalGainsAssetType
  readonly lots: readonly CapitalGainsLotInput[]
  readonly saleDate: string
  readonly unitsSold: number
  readonly salePricePerUnit: number
}

export type CapitalGainsMatchedLot = {
  readonly lotId: string
  readonly purchaseDate: string
  readonly matchedUnits: number
  readonly originalCostPerUnit: number
  readonly holdingPeriodDays: number
  readonly classification: CapitalGainsClassification
  readonly isGrandfathered: boolean
  /** The cost per unit actually used to compute this lot's gain — equal to originalCostPerUnit
   * unless isGrandfathered is true, in which case it is the section 112A higher-of/lower-of
   * figure computed from originalCostPerUnit, the lot's FMV on 31 Jan 2018, and the sale price. */
  readonly effectiveCostPerUnit: number
  readonly saleValue: number
  readonly costValue: number
  readonly gain: number
}

export type CapitalGainsResult = {
  readonly assetType: CapitalGainsAssetType
  readonly saleDate: string
  readonly unitsSold: number
  readonly salePricePerUnit: number
  readonly totalSaleValue: number
  readonly matchedLots: readonly CapitalGainsMatchedLot[]
  readonly totalSTCG: number
  readonly totalLTCG: number
  readonly ltcgExemptionUsed: number
  readonly ltcgTaxableAfterExemption: number
  readonly stcgTax: number
  readonly ltcgTax: number
  readonly totalTax: number
  readonly netProceedsAfterTax: number
}

export type CapitalGainsLotField = keyof CapitalGainsLotInput
export type CapitalGainsLotValidationErrors = Partial<Record<Exclude<CapitalGainsLotField, "id">, string>>
export type CapitalGainsValidationErrors = {
  assetType?: string
  saleDate?: string
  unitsSold?: string
  salePricePerUnit?: string
  lots?: string
  lotErrors?: Record<string, CapitalGainsLotValidationErrors>
}
export type CapitalGainsValidationResult =
  | { readonly success: true; readonly data: CapitalGainsInput }
  | { readonly success: false; readonly errors: CapitalGainsValidationErrors }
