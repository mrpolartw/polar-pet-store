import { model } from "@medusajs/framework/utils"

const MemberLevel = model.define("membership_member_level", {
  id: model.id().primaryKey(),
  name: model.text(),
  sort_order: model.number().default(0),
  reward_rate: model.number().default(0),
  birthday_reward_rate: model.number().default(0),
  upgrade_gift_points: model.number().default(0),
  upgrade_threshold: model.number().default(0),
  auto_upgrade: model.boolean().default(false),
  can_join_event: model.boolean().default(false),
  is_active: model.boolean().default(true),
})

export default MemberLevel
