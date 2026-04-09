import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getMembershipService } from "../../helpers"
import {
  assertMemberLevelCanBeDeleted,
  retrieveAdminMemberLevel,
} from "../../../../../lib/membership/admin-member-levels"
import type {
  AdminDeletedResponse,
  AdminMemberLevelResponse,
} from "../../types"
import type { AdminUpdateMemberLevelType } from "../../validators"

export async function PATCH(
  req: AuthenticatedMedusaRequest<AdminUpdateMemberLevelType>,
  res: MedusaResponse<AdminMemberLevelResponse>
): Promise<void> {
  const membershipService = getMembershipService(req.scope)
  await membershipService.updateMemberLevel(
    req.params.id,
    req.validatedBody
  )
  const memberLevel = await retrieveAdminMemberLevel(req.scope, req.params.id)

  res.status(200).json({
    member_level: memberLevel,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminDeletedResponse>
): Promise<void> {
  const membershipService = getMembershipService(req.scope)

  await assertMemberLevelCanBeDeleted(req.scope, req.params.id)
  await membershipService.deleteMemberLevel(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "member_level",
    deleted: true,
  })
}
