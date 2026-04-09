export const CUSTOMER_GENDERS = ["male", "female", "other"] as const

export type CustomerGender = (typeof CUSTOMER_GENDERS)[number]
