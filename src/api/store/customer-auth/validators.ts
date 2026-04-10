import { z } from "@medusajs/framework/zod"

import {
  CUSTOMER_GENDERS,
  PET_GENDERS,
  PET_SPECIES,
} from "../../../modules/membership/constants"

const normalizedEmail = z.string().trim().email()
const passwordSchema = z.string().min(8)
const nullableDateString = z.string().min(1).nullish()
const petSchema = z.object({
  name: z.string().trim().min(1),
  species: z.enum(PET_SPECIES).nullish(),
  breed: z.string().trim().min(1).nullish(),
  birthday: nullableDateString,
  gender: z.enum(PET_GENDERS).optional(),
  metadata: z.record(z.unknown()).nullish(),
})

export const StoreCustomerRegister = z.object({
  name: z.string().trim().min(1),
  email: normalizedEmail,
  password: passwordSchema,
  phone: z.string().trim().min(1).nullish(),
  birthday: nullableDateString,
  gender: z.enum(CUSTOMER_GENDERS).nullish(),
  pets: z.array(petSchema).max(10).optional(),
})

export const StoreCustomerLogin = z.object({
  email: normalizedEmail,
  password: z.string().min(1),
})

export const StoreCustomerEmailVerificationRequest = z.object({
  email: normalizedEmail,
})

export const StoreCustomerRegisterEmailStatus = z.object({
  email: normalizedEmail,
})

export const StoreCustomerEmailVerificationConfirm = z.object({
  token: z.string().trim().min(1),
})

export const StoreCustomerPasswordResetRequest = z.object({
  email: normalizedEmail,
})

export const StoreCustomerPasswordResetValidate = z.object({
  token: z.string().trim().min(1),
})

export const StoreCustomerPasswordResetConfirm = z.object({
  token: z.string().trim().min(1),
  password: passwordSchema,
})

export const StoreCustomerLineComplete = z.object({
  token: z.string().trim().min(1),
  email: normalizedEmail,
  name: z.string().trim().min(1).nullish(),
})

export const StoreCustomerProfileUpdate = z.object({
  name: z.string().trim().min(1).nullish(),
  phone: z.string().trim().min(1).nullish(),
  birthday: nullableDateString,
  gender: z.enum(CUSTOMER_GENDERS).nullish(),
  avatar: z.string().trim().min(1).nullish(),
})

export type StoreCustomerRegisterType = z.infer<typeof StoreCustomerRegister>
export type StoreCustomerLoginType = z.infer<typeof StoreCustomerLogin>
export type StoreCustomerEmailVerificationRequestType = z.infer<
  typeof StoreCustomerEmailVerificationRequest
>
export type StoreCustomerRegisterEmailStatusType = z.infer<
  typeof StoreCustomerRegisterEmailStatus
>
export type StoreCustomerEmailVerificationConfirmType = z.infer<
  typeof StoreCustomerEmailVerificationConfirm
>
export type StoreCustomerPasswordResetRequestType = z.infer<
  typeof StoreCustomerPasswordResetRequest
>
export type StoreCustomerPasswordResetValidateType = z.infer<
  typeof StoreCustomerPasswordResetValidate
>
export type StoreCustomerPasswordResetConfirmType = z.infer<
  typeof StoreCustomerPasswordResetConfirm
>
export type StoreCustomerLineCompleteType = z.infer<
  typeof StoreCustomerLineComplete
>
export type StoreCustomerProfileUpdateType = z.infer<
  typeof StoreCustomerProfileUpdate
>
