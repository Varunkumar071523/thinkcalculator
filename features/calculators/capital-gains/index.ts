export { calculateCapitalGains } from "./calculate-capital-gains"
export { CapitalGainsCalculator } from "./capital-gains-calculator"
export { capitalGainsCalculatorDefinition } from "./capital-gains-definition"
export { capitalGainsKnowledgeContent } from "./capital-gains-knowledge-content"
export { toLiveInput as toCapitalGainsLiveInput } from "./capital-gains-live-input"
export { matchLotsFifo } from "./capital-gains-fifo-matcher"
export { computeGrandfatheredCostPerUnit, isGrandfatheringApplicable } from "./capital-gains-grandfathering"
export { classifyHoldingPeriod, computeHoldingPeriodDays } from "./capital-gains-holding-period"
export { computeCapitalGainsTax } from "./capital-gains-tax"
export {
  CAPITAL_GAINS_GRANDFATHERING_CUTOFF_DATE,
  CAPITAL_GAINS_LONG_TERM_HOLDING_MONTHS,
  CAPITAL_GAINS_LTCG_ANNUAL_EXEMPTION,
  CAPITAL_GAINS_LTCG_TAX_RATE,
  CAPITAL_GAINS_OFFICIAL_SOURCES,
  CAPITAL_GAINS_REGULATORY_REVIEW_DATE,
  CAPITAL_GAINS_STCG_TAX_RATE,
} from "./capital-gains-regulatory-config"
export {
  CAPITAL_GAINS_DEFAULT_INPUT,
  buildCapitalGainsCalculatorUrl,
  parseCapitalGainsUrlState,
  parseValidCapitalGainsUrlState,
  serializeCapitalGainsUrlState,
} from "./capital-gains-url-state"
export type { CapitalGainsInput, CapitalGainsResult } from "./capital-gains-types"
