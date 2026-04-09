import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createCustomersWorkflow } from "@medusajs/medusa/core-flows"
import type { Link } from "@medusajs/modules-sdk"
import type MembershipModuleService from "../../modules/membership/service"
import { selectMembershipLevelByYearlySpent } from "../../lib/membership/membership-level-rules"
import { MEMBERSHIP_MODULE } from "../../modules/membership"

createCustomersWorkflow.hooks.customersCreated(
  async ({ customers }, { container }) => {
    const membershipService =
      container.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
    const levels = await membershipService.listMemberLevels(
      { is_active: true },
      {
        order: {
          sort_order: "ASC",
          upgrade_threshold: "ASC",
          id: "ASC",
        },
      }
    )
    const defaultLevel = selectMembershipLevelByYearlySpent(levels, 0).level

    if (!defaultLevel) {
      return
    }

    for (const customer of customers) {
      if (!customer.id) {
        continue
      }

      await link.create([
        {
          [MEMBERSHIP_MODULE]: {
            membership_member_level_id: defaultLevel.id,
          },
          [Modules.CUSTOMER]: {
            customer_id: customer.id,
          },
        },
      ])

      await membershipService.createAuditLog({
        actor_type: "system",
        actor_id: "system",
        action: "ASSIGN_DEFAULT_LEVEL",
        target_type: "customer",
        target_id: customer.id,
        before_state: null,
        after_state: {
          level_id: defaultLevel.id,
          level_name: defaultLevel.name,
        },
      })
    }
  }
)
