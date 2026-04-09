import { z } from "@medusajs/framework/zod"
import { CUSTOMER_GENDERS } from "../../../../lib/membership/customer-gender"

function normalizeEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function isValidDateOnlyString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const nullablePhone = z.preprocess(
  normalizeEmptyString,
  z.string().min(1).max(30).nullish()
)

const nullableBirthday = z.preprocess(
  normalizeEmptyString,
  z
    .string()
    .refine(isValidDateOnlyString, { message: "生日必須是有效日期" })
    .nullish()
)

export const AdminUpdateCustomerMembership = z
  .object({
    phone: nullablePhone.optional(),
    birthday: nullableBirthday.optional(),
    gender: z.enum(CUSTOMER_GENDERS).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "至少要提供一個可更新欄位",
  })

export type AdminUpdateCustomerMembershipType = z.infer<
  typeof AdminUpdateCustomerMembership
>
