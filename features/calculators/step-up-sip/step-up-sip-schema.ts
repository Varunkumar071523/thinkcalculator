import type { StepUpSIPInput, StepUpSIPValidationErrors, StepUpSIPValidationResult } from "./step-up-sip-types"

export const STEP_UP_SIP_LIMITS = {
  initialMonthlyInvestment: { min: 500, max: 10_000_000 },
  annualStepUpPercentage: { min: 0, max: 100 },
  annualStepUpFixed: { min: 0, max: 10_000_000 },
  expectedAnnualReturn: { min: 0, max: 50 },
  durationYears: { min: 1, max: 50 },
} as const

export type StepUpSIPFormValues = { readonly initialMonthlyInvestment:string; readonly stepUpMode:string; readonly annualStepUpValue:string; readonly expectedAnnualReturn:string; readonly durationYears:string }

export function parseStepUpSIPNumericText(value: string): number | null {
  if (value === "" || value.trim() !== value || !/^(?:\d+|\d*\.\d+)$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateStepUpSIPInput(input: StepUpSIPInput): StepUpSIPValidationResult {
  const errors: StepUpSIPValidationErrors = {}
  if (!Number.isFinite(input.initialMonthlyInvestment) || input.initialMonthlyInvestment < STEP_UP_SIP_LIMITS.initialMonthlyInvestment.min || input.initialMonthlyInvestment > STEP_UP_SIP_LIMITS.initialMonthlyInvestment.max) errors.initialMonthlyInvestment = "Enter a monthly SIP between ₹500 and ₹1,00,00,000."
  if (input.stepUpMode !== "percentage" && input.stepUpMode !== "fixed") errors.stepUpMode = "Choose percentage or fixed amount."
  const stepUpMax = input.stepUpMode === "fixed" ? STEP_UP_SIP_LIMITS.annualStepUpFixed.max : STEP_UP_SIP_LIMITS.annualStepUpPercentage.max
  if (!Number.isFinite(input.annualStepUpValue) || input.annualStepUpValue < 0 || input.annualStepUpValue > stepUpMax) errors.annualStepUpValue = input.stepUpMode === "fixed" ? "Enter an annual increase from ₹0 to ₹1,00,00,000." : "Enter an annual increase from 0% to 100%."
  if (!Number.isFinite(input.expectedAnnualReturn) || input.expectedAnnualReturn < STEP_UP_SIP_LIMITS.expectedAnnualReturn.min || input.expectedAnnualReturn > STEP_UP_SIP_LIMITS.expectedAnnualReturn.max) errors.expectedAnnualReturn = "Enter an expected annual return between 0% and 50%."
  if (!Number.isInteger(input.durationYears) || input.durationYears < STEP_UP_SIP_LIMITS.durationYears.min || input.durationYears > STEP_UP_SIP_LIMITS.durationYears.max) errors.durationYears = "Enter a whole-number duration between 1 and 50 years."
  if (Object.keys(errors).length === 0) {
    const lastContribution = input.stepUpMode === "percentage" ? input.initialMonthlyInvestment * Math.pow(1 + input.annualStepUpValue / 100, input.durationYears - 1) : input.initialMonthlyInvestment + input.annualStepUpValue * (input.durationYears - 1)
    if (!Number.isFinite(lastContribution) || lastContribution > Number.MAX_SAFE_INTEGER) errors.annualStepUpValue = "This combination grows contributions beyond a safe calculation range."
  }
  return Object.keys(errors).length ? { success:false, errors } : { success:true, data:input }
}

export function parseAndValidateStepUpSIPForm(values: StepUpSIPFormValues): StepUpSIPValidationResult {
  const initialMonthlyInvestment = parseStepUpSIPNumericText(values.initialMonthlyInvestment)
  const annualStepUpValue = parseStepUpSIPNumericText(values.annualStepUpValue)
  const expectedAnnualReturn = parseStepUpSIPNumericText(values.expectedAnnualReturn)
  const durationYears = parseStepUpSIPNumericText(values.durationYears)
  const errors: StepUpSIPValidationErrors = {}
  if (initialMonthlyInvestment === null) errors.initialMonthlyInvestment = "Enter a valid plain-decimal monthly SIP without spaces, commas, symbols, or exponent notation."
  if (annualStepUpValue === null) errors.annualStepUpValue = "Enter a valid plain-decimal annual step-up without spaces, symbols, or exponent notation."
  if (expectedAnnualReturn === null) errors.expectedAnnualReturn = "Enter a valid plain-decimal expected return without spaces, symbols, or exponent notation."
  if (durationYears === null) errors.durationYears = "Enter a whole-number duration without spaces or symbols."
  if (values.stepUpMode !== "percentage" && values.stepUpMode !== "fixed") errors.stepUpMode = "Choose percentage or fixed amount."
  if (Object.keys(errors).length || initialMonthlyInvestment === null || annualStepUpValue === null || expectedAnnualReturn === null || durationYears === null || (values.stepUpMode !== "percentage" && values.stepUpMode !== "fixed")) return { success:false, errors }
  return validateStepUpSIPInput({ initialMonthlyInvestment, stepUpMode:values.stepUpMode, annualStepUpValue, expectedAnnualReturn, durationYears })
}
