import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import type { LinkDefinition } from "@medusajs/framework/types"
import type { Link } from "@medusajs/modules-sdk"
import type { GraphResultSet } from "@medusajs/types"
import type MembershipModuleService from "../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../modules/membership"

const CUSTOMER_LINKABLE_KEY = "customer_id"
const MEMBER_LEVEL_LINKABLE_KEY = "membership_member_level_id"

export const customerMembershipFields = [
  "id",
  "company_name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "metadata",
  "has_account",
  "created_by",
  "created_at",
  "updated_at",
  "deleted_at",
] as const

type CustomerRecord = GraphResultSet<"customer">["data"][number]
type MembershipLevelRecord =
  GraphResultSet<"membership_member_level">["data"][number]

export type CustomerWithMembershipLevel = CustomerRecord & {
  membership_member_level?: MembershipLevelRecord | null
}

type ListCustomersInput = {
  filters?: Record<string, unknown>
  pagination?: {
    skip?: number
    take?: number
    order?: Record<string, string>
  }
}

type ListCustomersResult = {
  rows: CustomerWithMembershipLevel[]
  metadata: {
    count: number
    skip: number
    take: number
  }
}

function getMembershipService(scope: MedusaContainer): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getLink(scope: MedusaContainer): Link {
  return scope.resolve<Link>(ContainerRegistrationKeys.LINK)
}

function getRemoteQuery(scope: MedusaContainer) {
  return scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY) as (
    query: unknown
  ) => Promise<
    | CustomerRecord[]
    | {
        rows: CustomerRecord[]
        metadata?: {
          count?: number
          skip?: number
          take?: number
        }
      }
  >
}

function compareMembershipLevelPriority(
  candidate: MembershipLevelRecord,
  current: MembershipLevelRecord
): number {
  if (candidate.rank !== current.rank) {
    return candidate.rank - current.rank
  }

  if (candidate.min_points !== current.min_points) {
    return candidate.min_points - current.min_points
  }

  return candidate.id.localeCompare(current.id)
}

function buildCustomerLevelLink(
  customerId: string,
  memberLevelId: string
): LinkDefinition {
  return {
    [MEMBERSHIP_MODULE]: {
      [MEMBER_LEVEL_LINKABLE_KEY]: memberLevelId,
    },
    [Modules.CUSTOMER]: {
      [CUSTOMER_LINKABLE_KEY]: customerId,
    },
  }
}

function extractCustomerId(link: LinkDefinition): string | null {
  const customerLink = link[Modules.CUSTOMER]

  if (!customerLink) {
    return null
  }

  const value = customerLink[CUSTOMER_LINKABLE_KEY]

  return typeof value === "string" ? value : null
}

function extractMemberLevelId(link: LinkDefinition): string | null {
  const membershipLink = link[MEMBERSHIP_MODULE]

  if (!membershipLink) {
    return null
  }

  const value = membershipLink[MEMBER_LEVEL_LINKABLE_KEY]

  return typeof value === "string" ? value : null
}

async function getCustomerLevelMap(
  scope: MedusaContainer,
  customerIds: string[]
): Promise<Map<string, MembershipLevelRecord>> {
  const uniqueCustomerIds = [...new Set(customerIds.filter(Boolean))]

  if (!uniqueCustomerIds.length) {
    return new Map()
  }

  const membershipService = getMembershipService(scope)
  const memberLevels = (await membershipService.listMemberLevels(
    {},
    {
      order: {
        rank: "DESC",
        min_points: "DESC",
        id: "DESC",
      },
    }
  )) as MembershipLevelRecord[]

  if (!memberLevels.length) {
    return new Map()
  }

  const link = getLink(scope)
  const levelById = new Map(memberLevels.map((level) => [level.id, level]))
  const linkDefinitions = uniqueCustomerIds.flatMap((customerId) =>
    memberLevels.map((level) => buildCustomerLevelLink(customerId, level.id))
  )
  const links = (await link.list(linkDefinitions, {
    asLinkDefinition: true,
  })) as LinkDefinition[]
  const customerLevelMap = new Map<string, MembershipLevelRecord>()

  for (const linkDefinition of links) {
    const customerId = extractCustomerId(linkDefinition)
    const memberLevelId = extractMemberLevelId(linkDefinition)

    if (!customerId || !memberLevelId) {
      continue
    }

    const nextLevel = levelById.get(memberLevelId)

    if (!nextLevel) {
      continue
    }

    const currentLevel = customerLevelMap.get(customerId)

    if (
      !currentLevel ||
      compareMembershipLevelPriority(nextLevel, currentLevel) > 0
    ) {
      customerLevelMap.set(customerId, nextLevel)
    }
  }

  return customerLevelMap
}

function attachMembershipLevels(
  customers: CustomerRecord[],
  customerLevelMap: Map<string, MembershipLevelRecord>
): CustomerWithMembershipLevel[] {
  return customers.map((customer) => ({
    ...customer,
    membership_member_level: customerLevelMap.get(customer.id) ?? null,
  }))
}

export async function listCustomersWithMembershipLevels(
  scope: MedusaContainer,
  input: ListCustomersInput = {}
): Promise<ListCustomersResult> {
  const remoteQuery = getRemoteQuery(scope)
  const query = remoteQueryObjectFromString({
    entryPoint: "customers",
    variables: {
      filters: input.filters ?? {},
      ...(input.pagination ?? {}),
    },
    fields: [...customerMembershipFields],
  })
  const response = (await remoteQuery(query)) as {
    rows: CustomerRecord[]
    metadata?: {
      count?: number
      skip?: number
      take?: number
    }
  }
  const rows = response.rows ?? []
  const customerLevelMap = await getCustomerLevelMap(
    scope,
    rows.map((customer) => customer.id)
  )

  return {
    rows: attachMembershipLevels(rows, customerLevelMap),
    metadata: {
      count: response.metadata?.count ?? rows.length,
      skip: response.metadata?.skip ?? input.pagination?.skip ?? 0,
      take: response.metadata?.take ?? input.pagination?.take ?? rows.length,
    },
  }
}

export async function retrieveCustomerWithMembershipLevel(
  scope: MedusaContainer,
  customerId: string
): Promise<CustomerWithMembershipLevel | null> {
  const remoteQuery = getRemoteQuery(scope)
  const query = remoteQueryObjectFromString({
    entryPoint: "customer",
    variables: {
      filters: {
        id: customerId,
      },
    },
    fields: [...customerMembershipFields],
  })
  const response = (await remoteQuery(query)) as CustomerRecord[]
  const customer = response[0]

  if (!customer) {
    return null
  }

  const customerLevelMap = await getCustomerLevelMap(scope, [customerId])

  return {
    ...customer,
    membership_member_level: customerLevelMap.get(customerId) ?? null,
  }
}
