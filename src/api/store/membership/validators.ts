import { z } from "@medusajs/framework/zod"
import {
  BILLING_INTERVALS,
  PET_GENDERS,
  PET_SPECIES,
  SUBSCRIPTION_STATUSES,
} from "../../../modules/membership/constants"

const metadataSchema = z.record(z.unknown()).nullish()
const nullableDateString = z.string().min(1).nullish()

export const StoreGetCustomerPointsParams = z.object({
  limit: z.coerce.number().int().min(0).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const StorePreviewMembershipPointRedemption = z.object({
  points: z.coerce.number().int().min(0),
  order_subtotal: z.coerce.number().finite().min(0),
})

export const StoreApplyMembershipPointRedemption = z.object({
  points: z.coerce.number().int().positive(),
  order_subtotal: z.coerce.number().finite().min(0),
  reference_id: z.string().min(1),
  note: z.string().min(1).nullish(),
  metadata: metadataSchema,
})

export const StoreAddFavorite = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1).nullish(),
})

export const StoreCreatePet = z.object({
  name: z.string().min(1),
  species: z.enum(PET_SPECIES).nullish(),
  breed: z.string().min(1).nullish(),
  birthday: nullableDateString,
  gender: z.enum(PET_GENDERS).optional(),
  avatar_url: z.string().min(1).nullish(),
  metadata: metadataSchema,
})

export const StoreUpdatePet = StoreCreatePet.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided",
  }
)

export const StoreCreateSubscription = z.object({
  plan_name: z.string().min(1),
  started_at: z.string().min(1).optional(),
  expires_at: nullableDateString,
  next_billing_at: nullableDateString,
  billing_interval: z.enum(BILLING_INTERVALS).nullish(),
  amount: z.number().finite().nullish(),
  currency_code: z.string().min(1).optional(),
  metadata: metadataSchema,
})

export const StoreUpdateSubscription = z
  .object({
    plan_name: z.string().min(1).optional(),
    status: z.enum(SUBSCRIPTION_STATUSES).optional(),
    expires_at: nullableDateString,
    next_billing_at: nullableDateString,
    billing_interval: z.enum(BILLING_INTERVALS).nullish(),
    amount: z.number().finite().nullish(),
    currency_code: z.string().min(1).optional(),
    metadata: metadataSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })

export type StoreGetCustomerPointsParamsType = z.infer<
  typeof StoreGetCustomerPointsParams
>
export type StorePreviewMembershipPointRedemptionType = z.infer<
  typeof StorePreviewMembershipPointRedemption
>
export type StoreApplyMembershipPointRedemptionType = z.infer<
  typeof StoreApplyMembershipPointRedemption
>
export type StoreAddFavoriteType = z.infer<typeof StoreAddFavorite>
export type StoreCreatePetType = z.infer<typeof StoreCreatePet>
export type StoreUpdatePetType = z.infer<typeof StoreUpdatePet>
export type StoreCreateSubscriptionType = z.infer<
  typeof StoreCreateSubscription
>
export type StoreUpdateSubscriptionType = z.infer<
  typeof StoreUpdateSubscription
>
