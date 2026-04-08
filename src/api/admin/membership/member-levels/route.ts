import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getMembershipService,
} from "../helpers"
import type {
  AdminMemberLevelResponse,
  AdminMemberLevelsListResponse,
  MembershipLevelRecord,
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
  const membershipService = getMembershipService(req.scope)
  const filters =
    req.filterableFields.is_active !== undefined
      ? { is_active: req.filterableFields.is_active as boolean }
      : {}
  const order = req.queryConfig.pagination.order ?? {
    rank: "ASC",
    min_points: "ASC",
    id: "ASC",
  }

  const [memberLevels, allMemberLevels] = await Promise.all([
    membershipService.listMemberLevels(filters, {
      ...req.queryConfig.pagination,
      order,
    }),
    membershipService.listMemberLevels(filters, {
      order,
    }),
  ])

  res.json({
    member_levels: memberLevels as MembershipLevelRecord[],
    count: allMemberLevels.length,
    offset: req.queryConfig.pagination.skip,
    limit: req.queryConfig.pagination.take ?? memberLevels.length,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<AdminCreateMemberLevelType>,
  res: MedusaResponse<AdminMemberLevelResponse>
): Promise<void> {
  const membershipService = getMembershipService(req.scope)
  const memberLevel = (await membershipService.createMemberLevel(
    req.validatedBody
  )) as MembershipLevelRecord

  res.status(200).json({
    member_level: memberLevel,
  })
}
