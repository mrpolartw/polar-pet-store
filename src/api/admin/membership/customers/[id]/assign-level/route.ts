import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import { MEMBERSHIP_MODULE } from "../../../../../../modules/membership"
import {
  ensureMemberLevel,
  ensureMembershipCustomer,
  getAdminUserId,
  getMembershipService,
  summarizeMemberLevel,
} from "../../../../membership/helpers"
import type { AdminAssignMembershipLevelResponse } from "../../../../membership/types"
import type { AdminAssignMembershipLevelType } from "../../../../membership/validators"

export async function POST(
  req: AuthenticatedMedusaRequest<AdminAssignMembershipLevelType>,
  res: MedusaResponse<AdminAssignMembershipLevelResponse>
): Promise<void> {
  const adminUserId = getAdminUserId(req)
  const membershipService = getMembershipService(req.scope)
  const customer = await ensureMembershipCustomer(req.scope, req.params.id)
  const memberLevel = await ensureMemberLevel(
    req.scope,
    req.validatedBody.member_level_id
  )
  const link = req.scope.resolve<Link>(ContainerRegistrationKeys.LINK)
  const currentLevelId = customer.membership_member_level?.id ?? null

  if (currentLevelId && currentLevelId !== memberLevel.id) {
    await link.dismiss([
      {
        [MEMBERSHIP_MODULE]: {
          membership_member_level_id: currentLevelId,
        },
        [Modules.CUSTOMER]: {
          customer_id: req.params.id,
        },
      },
    ])
  }

  if (currentLevelId !== memberLevel.id) {
    await link.create([
      {
        [MEMBERSHIP_MODULE]: {
          membership_member_level_id: memberLevel.id,
        },
        [Modules.CUSTOMER]: {
          customer_id: req.params.id,
        },
      },
    ])
  }

  await membershipService.createAuditLog({
    actor_type: "admin",
    actor_id: adminUserId,
    action: "ASSIGN_LEVEL",
    target_type: "customer",
    target_id: req.params.id,
    before_state: {
      level_id: currentLevelId,
    },
    after_state: {
      level_id: memberLevel.id,
    },
  })

  res.status(200).json({
    customer_id: req.params.id,
    member_level: summarizeMemberLevel(memberLevel),
  })
}
