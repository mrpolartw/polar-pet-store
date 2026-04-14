import type {
  ICustomerModuleService,
  IUserModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type MembershipModuleService from "../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../modules/membership"

type ActorType = "customer" | "admin" | "system"

type PointLogLike = {
  id: string
  customer_id: string
  source: string
}

type AuditLogLike = {
  actor_type: ActorType
  actor_id: string
  action: string
  metadata?: Record<string, unknown> | null
  before_state?: Record<string, unknown> | null
  after_state?: Record<string, unknown> | null
}

export interface PointLogActorSummary {
  actor_type: ActorType
  actor_id: string
  actor_label: string
}

function getMembershipService(
  scope: MedusaContainer
): MembershipModuleService {
  return scope.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
}

function getUserService(scope: MedusaContainer): IUserModuleService {
  return scope.resolve<IUserModuleService>(Modules.USER)
}

function getCustomerService(scope: MedusaContainer): ICustomerModuleService {
  return scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

function readPointLogId(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const pointLogId = (value as Record<string, unknown>).point_log_id

  return typeof pointLogId === "string" && pointLogId.length > 0
    ? pointLogId
    : null
}

function buildFallbackActor(log: PointLogLike): PointLogActorSummary {
  if (log.source === "redeem") {
    return {
      actor_type: "customer",
      actor_id: log.customer_id,
      actor_label: "會員本人",
    }
  }

  if (log.source === "admin") {
    return {
      actor_type: "admin",
      actor_id: "admin",
      actor_label: "管理員",
    }
  }

  return {
    actor_type: "system",
    actor_id: "system",
    actor_label: "系統",
  }
}

function buildDisplayName(input: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  id: string
  fallbackPrefix: string
}): string {
  const fullName = [input.first_name, input.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  if (fullName) {
    if (input.email) {
      return `${fullName} (${input.email})`
    }

    return fullName
  }

  if (input.email) {
    return input.email
  }

  return `${input.fallbackPrefix} (${input.id})`
}

async function resolveActorLabels(
  scope: MedusaContainer,
  actors: Map<string, PointLogActorSummary>
): Promise<Map<string, PointLogActorSummary>> {
  const userService = getUserService(scope)
  const customerService = getCustomerService(scope)
  const resolved = new Map<string, PointLogActorSummary>()

  await Promise.all(
    Array.from(actors.entries()).map(async ([pointLogId, actor]) => {
      if (actor.actor_type === "system") {
        resolved.set(pointLogId, actor)
        return
      }

      if (actor.actor_type === "admin") {
        try {
          const user = await userService.retrieveUser(actor.actor_id)
          resolved.set(pointLogId, {
            ...actor,
            actor_label: buildDisplayName({
              id: actor.actor_id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              fallbackPrefix: "管理員",
            }),
          })
          return
        } catch (error) {
          if (
            !(error instanceof MedusaError) ||
            error.type !== MedusaError.Types.NOT_FOUND
          ) {
            throw error
          }
        }

        resolved.set(pointLogId, {
          ...actor,
          actor_label: actor.actor_id === "admin" ? "管理員" : `管理員 (${actor.actor_id})`,
        })
        return
      }

      try {
        const customer = await customerService.retrieveCustomer(actor.actor_id)
        resolved.set(pointLogId, {
          ...actor,
          actor_label: buildDisplayName({
            id: actor.actor_id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            fallbackPrefix: "會員",
          }),
        })
        return
      } catch (error) {
        if (
          !(error instanceof MedusaError) ||
          error.type !== MedusaError.Types.NOT_FOUND
        ) {
          throw error
        }
      }

      resolved.set(pointLogId, {
        ...actor,
        actor_label:
          actor.actor_id === "customer" ? "會員本人" : `會員 (${actor.actor_id})`,
      })
    })
  )

  return resolved
}

export async function mapPointLogActors(
  scope: MedusaContainer,
  customerId: string,
  logs: PointLogLike[]
): Promise<Map<string, PointLogActorSummary>> {
  if (!logs.length) {
    return new Map()
  }

  const membershipService = getMembershipService(scope)
  const pointLogIds = new Set(logs.map((log) => log.id))
  const auditLogs = (await membershipService.listAuditLogs(
    {
      target_type: "customer",
      target_id: customerId,
    },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )) as AuditLogLike[]

  const actorMap = new Map<string, PointLogActorSummary>()

  for (const auditLog of auditLogs) {
    const pointLogId =
      readPointLogId(auditLog.after_state) ??
      readPointLogId(auditLog.metadata) ??
      readPointLogId(auditLog.before_state)

    if (!pointLogId || !pointLogIds.has(pointLogId) || actorMap.has(pointLogId)) {
      continue
    }

    actorMap.set(pointLogId, {
      actor_type: auditLog.actor_type,
      actor_id: auditLog.actor_id,
      actor_label:
        auditLog.actor_type === "system"
          ? "系統"
          : auditLog.actor_type === "customer"
            ? "會員本人"
            : "管理員",
    })
  }

  for (const log of logs) {
    if (!actorMap.has(log.id)) {
      actorMap.set(log.id, buildFallbackActor(log))
    }
  }

  return resolveActorLabels(scope, actorMap)
}
