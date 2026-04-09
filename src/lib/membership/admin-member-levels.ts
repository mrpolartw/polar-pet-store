import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import type { GraphResultSet } from "@medusajs/types"
import type MembershipModuleService from "../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../modules/membership"

const CUSTOMER_LINKABLE_KEY = "customer_id"
const MEMBER_LEVEL_LINKABLE_KEY = "membership_member_level_id"

type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

type MemberLevelCustomerLink = {
  customer_id: string
  membership_member_level_id: string
}

type MemberLevelListFilters = {
  is_active?: boolean
}

type MemberLevelPagination = {
  skip: number
  take?: number
  order?: Record<string, string>
}

export interface AdminMemberLevelListItem extends MembershipLevelRecord {
  member_count: number
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getMemberLevelCustomerLinkModule(scope: MedusaContainer) {
  const link = scope.resolve<Link>(ContainerRegistrationKeys.LINK)
  const linkModule = link.getLinkModule(
    MEMBERSHIP_MODULE,
    MEMBER_LEVEL_LINKABLE_KEY,
    Modules.CUSTOMER,
    CUSTOMER_LINKABLE_KEY
  )

  if (!linkModule) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "找不到會員等級與顧客的關聯設定"
    )
  }

  return linkModule
}

function mapAdminMemberLevels(
  memberLevels: MembershipLevelRecord[],
  memberCountMap: Map<string, number>
): AdminMemberLevelListItem[] {
  return memberLevels.map((memberLevel) => ({
    ...memberLevel,
    member_count: memberCountMap.get(memberLevel.id) ?? 0,
  }))
}

async function retrieveMemberLevelRecord(
  scope: MedusaContainer,
  memberLevelId: string
): Promise<MembershipLevelRecord> {
  const membershipService = getMembershipService(scope)
  const [memberLevel] = (await membershipService.listMemberLevels(
    {
      id: memberLevelId,
    },
    {
      take: 1,
    }
  )) as MembershipLevelRecord[]

  if (!memberLevel) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Member level with id: ${memberLevelId} was not found`
    )
  }

  return memberLevel
}

export async function countMembersByMemberLevelIds(
  scope: MedusaContainer,
  memberLevelIds: string[]
): Promise<Map<string, number>> {
  const uniqueMemberLevelIds = [...new Set(memberLevelIds.filter(Boolean))]
  const memberCountMap = new Map(
    uniqueMemberLevelIds.map((memberLevelId) => [memberLevelId, 0])
  )

  if (!uniqueMemberLevelIds.length) {
    return memberCountMap
  }

  const linkModule = getMemberLevelCustomerLinkModule(scope)
  const links = (await linkModule.list(
    {
      membership_member_level_id: uniqueMemberLevelIds,
    },
    {
      select: ["membership_member_level_id", "customer_id"],
    }
  )) as MemberLevelCustomerLink[]

  const memberIdsByLevelId = new Map<string, Set<string>>()

  for (const link of links) {
    if (!link.membership_member_level_id || !link.customer_id) {
      continue
    }

    const memberIds =
      memberIdsByLevelId.get(link.membership_member_level_id) ?? new Set<string>()
    memberIds.add(link.customer_id)
    memberIdsByLevelId.set(link.membership_member_level_id, memberIds)
  }

  for (const memberLevelId of uniqueMemberLevelIds) {
    memberCountMap.set(
      memberLevelId,
      memberIdsByLevelId.get(memberLevelId)?.size ?? 0
    )
  }

  return memberCountMap
}

export async function listAdminMemberLevels(
  scope: MedusaContainer,
  input: {
    filters: MemberLevelListFilters
    pagination: MemberLevelPagination
  }
): Promise<{
  member_levels: AdminMemberLevelListItem[]
  metadata: {
    count: number
    skip: number
    take: number
  }
}> {
  const membershipService = getMembershipService(scope)
  const order = input.pagination.order ?? {
    sort_order: "ASC",
    upgrade_threshold: "ASC",
    id: "ASC",
  }
  const [memberLevels, allMemberLevels] = await Promise.all([
    membershipService.listMemberLevels(input.filters, {
      ...input.pagination,
      order,
    }) as Promise<MembershipLevelRecord[]>,
    membershipService.listMemberLevels(input.filters, {
      order,
    }) as Promise<MembershipLevelRecord[]>,
  ])
  const memberCountMap = await countMembersByMemberLevelIds(
    scope,
    memberLevels.map((memberLevel) => memberLevel.id)
  )

  return {
    member_levels: mapAdminMemberLevels(memberLevels, memberCountMap),
    metadata: {
      count: allMemberLevels.length,
      skip: input.pagination.skip,
      take: input.pagination.take ?? memberLevels.length,
    },
  }
}

export async function retrieveAdminMemberLevel(
  scope: MedusaContainer,
  memberLevelId: string
): Promise<AdminMemberLevelListItem> {
  const memberLevel = await retrieveMemberLevelRecord(scope, memberLevelId)
  const memberCountMap = await countMembersByMemberLevelIds(scope, [
    memberLevelId,
  ])

  return {
    ...memberLevel,
    member_count: memberCountMap.get(memberLevelId) ?? 0,
  }
}

export async function assertMemberLevelCanBeDeleted(
  scope: MedusaContainer,
  memberLevelId: string
): Promise<void> {
  const memberLevel = await retrieveAdminMemberLevel(scope, memberLevelId)

  if (memberLevel.member_count > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `目前仍有 ${memberLevel.member_count} 位會員使用「${memberLevel.name}」，請先移轉會員後再刪除。`
    )
  }
}
