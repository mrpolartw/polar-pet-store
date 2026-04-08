import { model } from "@medusajs/framework/utils"

const MemberLevel = model.define("membership_member_level", {
  id: model.id().primaryKey(),
  name: model.text(),
  rank: model.number().default(0),
  min_points: model.number().default(0),
  discount_rate: model.number().default(0),
  benefits: model.json().nullable(),
  is_active: model.boolean().default(true),
})

export default MemberLevel
