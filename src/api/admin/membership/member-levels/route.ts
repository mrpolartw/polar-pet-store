import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getMembershipService,
} from "../helpers"
import {
  listAdminMemberLevels,
  retrieveAdminMemberLevel,
} from "../../../../lib/membership/admin-member-levels"
import type {
  AdminMemberLevelResponse,
  AdminMemberLevelsListResponse,
} from "../types"
import type {
  AdminCreateMemberLevelType,
  AdminGetMembershipMemberLevelsParamsType,
} from "../validators"

export async function GET(
  req: AuthenticatedMedusaRequest<
    unknown,
    AdminGetMembershipMemberLevelsParamsType
  >,
  res: MedusaResponse<AdminMemberLevelsListResponse>
): Promise<void> {
  const filters =
    req.filterableFields.is_active !== undefined
      ? { is_active: req.filterableFields.is_active as boolean }
      : {}
  const result = await listAdminMemberLevels(req.scope, {
    filters,
    pagination: {
      skip: req.queryConfig.pagination.skip ?? 0,
      take: req.queryConfig.pagination.take,
      order: req.queryConfig.pagination.order,
    },
  })

  res.json({
    member_levels: result.member_levels,
    count: result.metadata.count,
    offset: result.metadata.skip,
    limit: result.metadata.take,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<AdminCreateMemberLevelType>,
  res: MedusaResponse<AdminMemberLevelResponse>
): Promise<void> {
  const membershipService = getMembershipService(req.scope)
  const createdMemberLevel = await membershipService.createMemberLevel(
    req.validatedBody
  )
  const memberLevel = await retrieveAdminMemberLevel(
    req.scope,
    createdMemberLevel.id
  )

  res.status(200).json({
    member_level: memberLevel,
  })
}
