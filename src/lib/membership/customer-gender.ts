export const CUSTOMER_GENDERS = ["male", "female", "undisclosed"] as const

export type CustomerGender = (typeof CUSTOMER_GENDERS)[number]
