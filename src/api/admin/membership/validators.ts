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

export const AdminGetMembershipMemberLevelsParams = listQueryBase.extend({
  is_active: booleanish.optional(),
})

export const AdminCreateMemberLevel = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().optional(),
  reward_rate: z.number().int().optional(),
  birthday_reward_rate: z.number().int().optional(),
  upgrade_gift_points: z.number().int().optional(),
  upgrade_threshold: z.number().int().optional(),
  auto_upgrade: z.boolean().optional(),
  can_join_event: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const AdminUpdateMemberLevel = AdminCreateMemberLevel.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided",
  }
)

export const AdminGetMembershipCustomersParams = listQueryBase.extend({
  q: z.string().optional(),
  id: stringOrArray.optional(),
  email: stringOrArray.optional(),
  first_name: stringOrArray.optional(),
  phone: stringOrArray.optional(),
})

export const AdminGetMembershipCustomerPointsParams = listQueryBase

export const AdminGetMembershipCustomerAuditLogsParams = listQueryBase.extend({
  action: stringOrArray.optional(),
})

export const AdminAdjustMembershipPoints = z.object({
  delta: z.number().finite().refine((value) => value !== 0, {
    message: "delta cannot be 0",
  }),
  note: z.string().nullish(),
  source: z.literal("admin").optional(),
})

export const AdminAssignMembershipLevel = z.object({
  member_level_id: z.string().min(1),
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
