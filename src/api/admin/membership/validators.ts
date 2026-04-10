import { z } from "@medusajs/framework/zod"

const listQueryBase = z.object({
  limit: z.coerce.number().int().min(0).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  order: z.string().optional(),
  fields: z.string().optional(),
})

const stringOrArray = z.union([z.string(), z.array(z.string())])
const booleanish = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true")

function normalizeNumberInput(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmedValue = value.trim()

    return trimmedValue.length ? Number(trimmedValue) : Number.NaN
  }

  return value
}

function createRequiredNonNegativeInteger(label: string) {
  return z.preprocess(
    normalizeNumberInput,
    z
      .number({
        required_error: `請輸入${label}`,
        invalid_type_error: `${label}必須是數字`,
      })
      .finite(`${label}必須是數字`)
      .int(`${label}必須是非負整數`)
      .min(0, `${label}必須是非負整數`)
  )
}

function createOptionalNonNegativeInteger(label: string) {
  return createRequiredNonNegativeInteger(label).optional()
}

function createRequiredNonNegativeNumber(label: string) {
  return z.preprocess(
    normalizeNumberInput,
    z
      .number({
        required_error: `請輸入${label}`,
        invalid_type_error: `${label}必須是數字`,
      })
      .finite(`${label}必須是數字`)
      .min(0, `${label}不可小於 0`)
  )
}

function createOptionalNonNegativeNumber(label: string) {
  return createRequiredNonNegativeNumber(label).optional()
}

function createRequiredBoolean(label: string) {
  return z.boolean({
    required_error: `請指定${label}`,
    invalid_type_error: `${label}必須是布林值`,
  })
}

function createOptionalBoolean(label: string) {
  return createRequiredBoolean(label).optional()
}

export const AdminGetMembershipMemberLevelsParams = listQueryBase.extend({
  is_active: booleanish.optional(),
})

export const AdminCreateMemberLevel = z.object({
  name: z
    .string({
      required_error: "請輸入會員等級名稱",
      invalid_type_error: "會員等級名稱必須是文字",
    })
    .trim()
    .min(1, "請輸入會員等級名稱"),
  sort_order: createRequiredNonNegativeInteger("排序"),
  reward_rate: createRequiredNonNegativeNumber("回饋倍率"),
  birthday_reward_rate: createRequiredNonNegativeNumber("生日回饋倍率"),
  upgrade_gift_points: createRequiredNonNegativeInteger("升級贈點"),
  upgrade_threshold: createRequiredNonNegativeInteger("升級門檻"),
  auto_upgrade: createRequiredBoolean("自動升級"),
  can_join_event: createRequiredBoolean("可參加活動"),
  is_active: createRequiredBoolean("啟用狀態"),
})

export const AdminUpdateMemberLevel = z
  .object({
    name: z
      .string({
        invalid_type_error: "會員等級名稱必須是文字",
      })
      .trim()
      .min(1, "請輸入會員等級名稱")
      .optional(),
    sort_order: createOptionalNonNegativeInteger("排序"),
    reward_rate: createOptionalNonNegativeNumber("回饋倍率"),
    birthday_reward_rate: createOptionalNonNegativeNumber("生日回饋倍率"),
    upgrade_gift_points: createOptionalNonNegativeInteger("升級贈點"),
    upgrade_threshold: createOptionalNonNegativeInteger("升級門檻"),
    auto_upgrade: createOptionalBoolean("自動升級"),
    can_join_event: createOptionalBoolean("可參加活動"),
    is_active: createOptionalBoolean("啟用狀態"),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "至少要提供一個可更新的欄位",
  })

export const AdminGetMembershipCustomersParams = listQueryBase.extend({
  q: z.string().optional(),
  id: stringOrArray.optional(),
  email: stringOrArray.optional(),
  first_name: stringOrArray.optional(),
  phone: stringOrArray.optional(),
  groups: stringOrArray.optional(),
  has_account: booleanish.optional(),
})

export const AdminGetMembershipCustomerPointsParams = listQueryBase

export const AdminGetMembershipCustomerAuditLogsParams = listQueryBase.extend({
  action: stringOrArray.optional(),
})

export const AdminAdjustMembershipPoints = z.object({
  delta: z.number().finite().refine((value) => value !== 0, {
    message: "點數異動不可為 0",
  }),
  note: z.string().nullish(),
  source: z.literal("admin").optional(),
})

export const AdminAssignMembershipLevel = z.object({
  member_level_id: z.string().min(1),
})

export const AdminProcessMembershipOrderRefund = z.object({
  refund_amount: z.coerce.number().int().positive(),
  reference_id: z.string().trim().min(1).optional(),
  note: z.string().trim().min(1).optional(),
})

export type AdminGetMembershipMemberLevelsParamsType = z.infer<
  typeof AdminGetMembershipMemberLevelsParams
>
export type AdminCreateMemberLevelType = z.infer<typeof AdminCreateMemberLevel>
export type AdminUpdateMemberLevelType = z.infer<typeof AdminUpdateMemberLevel>
export type AdminGetMembershipCustomersParamsType = z.infer<
  typeof AdminGetMembershipCustomersParams
>
export type AdminGetMembershipCustomerPointsParamsType = z.infer<
  typeof AdminGetMembershipCustomerPointsParams
>
export type AdminGetMembershipCustomerAuditLogsParamsType = z.infer<
  typeof AdminGetMembershipCustomerAuditLogsParams
>
export type AdminAdjustMembershipPointsType = z.infer<
  typeof AdminAdjustMembershipPoints
>
export type AdminAssignMembershipLevelType = z.infer<
  typeof AdminAssignMembershipLevel
>
export type AdminProcessMembershipOrderRefundType = z.infer<
  typeof AdminProcessMembershipOrderRefund
>
