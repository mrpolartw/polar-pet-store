import { z } from "@medusajs/framework/zod"

const nullableString = z.string().trim().min(1).nullish()

const orderItemSchema = z.object({
  id: nullableString,
  productId: z.union([z.string(), z.number()]).nullish(),
  variantId: nullableString,
  name: z.string().trim().min(1),
  image: nullableString,
  specs: nullableString,
  price: z.coerce.number().int().min(0),
  quantity: z.coerce.number().int().min(1).max(99),
})

const pointRedemptionSchema = z
  .object({
    requestedPoints: z.coerce.number().int().min(0),
    redeemedPoints: z.coerce.number().int().min(0),
    redemptionAmount: z.coerce.number().int().min(0),
    referenceId: nullableString,
    remainingAmount: z.coerce.number().int().min(0).optional(),
    orderSubtotal: z.coerce.number().int().min(0),
  })
  .nullish()

export const StoreCreateOrder = z.object({
  shippingMethod: z.enum(["home", "store"]),
  paymentMethod: z.enum(["credit", "linepay", "applepay", "transfer"]),
  buyerName: z.string().trim().min(1),
  buyerEmail: z.string().trim().email(),
  buyerPhone: z.string().trim().min(8),
  recipientName: z.string().trim().min(1),
  recipientPhone: z.string().trim().min(8),
  promoCode: nullableString,
  deliveryNote: nullableString,
  subtotal: z.coerce.number().int().min(0),
  shippingFee: z.coerce.number().int().min(0),
  discount: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(0),
  items: z.array(orderItemSchema).min(1),
  pointRedemption: pointRedemptionSchema,
})

export const StoreLookupOrdersByPhone = z.object({
  phone: z.string().trim().min(8),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type StoreCreateOrderType = z.infer<typeof StoreCreateOrder>
export type StoreLookupOrdersByPhoneType = z.infer<
  typeof StoreLookupOrdersByPhone
>
