export const CUSTOMER_GENDERS = ["male", "female", "unknown"] as const

export type CustomerGender = (typeof CUSTOMER_GENDERS)[number]
