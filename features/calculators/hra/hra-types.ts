import type { HraCalcValidationErrors, HraCity } from "@/lib/hra/types"

export type { HraCity } from "@/lib/hra/types"

export type HraFormValues = {
  readonly basicSalary: string
  readonly da: string
  readonly hraReceived: string
  readonly rentPaid: string
  readonly city: HraCity
}

export type HraFormErrors = HraCalcValidationErrors
