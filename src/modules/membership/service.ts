import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaService,
  Modules,
} from "@medusajs/framework/utils"
import type {
  FindConfig,
  ICustomerModuleService,
  InferTypeOf,
  LinkDefinition,
} from "@medusajs/framework/types"
import type { Link } from "@medusajs/modules-sdk"

import {
  type AuditActorType,
  type BillingInterval,
  type CustomerGender,
  type OAuthProvider,
  type PetGender,
  type PetSpecies,
  type PointLogSource,
  type SubscriptionStatus,
} from "./constants"
import { MEMBERSHIP_MODULE } from "./index"
import { recalculateCustomerMembershipLevel } from "../../lib/membership/customer-membership-level"
import AuditLog from "./models/audit-log"
import CustomerProfile from "./models/customer-profile"
import Favorite from "./models/favorite"
import MemberLevel from "./models/member-level"
import OAuthLink from "./models/oauth-link"
import Pet from "./models/pet"
import PointLog from "./models/point-log"
import Subscription from "./models/subscription"

type JsonValue = Record<string, unknown> | null

type MemberLevelDTO = InferTypeOf<typeof MemberLevel>
type PointLogDTO = InferTypeOf<typeof PointLog>
type SubscriptionDTO = InferTypeOf<typeof Subscription>
type OAuthLinkDTO = InferTypeOf<typeof OAuthLink>
type PetDTO = InferTypeOf<typeof Pet>
type FavoriteDTO = InferTypeOf<typeof Favorite>
type AuditLogDTO = InferTypeOf<typeof AuditLog>
type CustomerProfileDTO = InferTypeOf<typeof CustomerProfile>

type MemberLevelListFilters = Partial<
  Pick<
    MemberLevelDTO,
    | "id"
    | "name"
    | "sort_order"
    | "reward_rate"
    | "birthday_reward_rate"
    | "upgrade_gift_points"
    | "upgrade_threshold"
    | "auto_upgrade"
    | "can_join_event"
    | "is_active"
  >
>

type CreateMemberLevelInput = {
  name: string
  sort_order?: number
  reward_rate?: number
  birthday_reward_rate?: number
  upgrade_gift_points?: number
  upgrade_threshold?: number
  auto_upgrade?: boolean
  can_join_event?: boolean
  is_active?: boolean
}

type UpdateMemberLevelInput = Partial<CreateMemberLevelInput>

type CreateSubscriptionInput = {
  plan_name: string
  status?: SubscriptionStatus
  started_at: Date
  expires_at?: Date | null
  next_billing_at?: Date | null
  billing_interval?: BillingInterval | null
  amount?: number | null
  currency_code?: string
  metadata?: Record<string, unknown> | null
}

type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>

type OAuthTokenData = {
  provider_email?: string | null
  access_token?: string | null
  refresh_token?: string | null
  token_expires_at?: Date | null
}

type CreatePetInput = {
  name: string
  species?: PetSpecies | null
  breed?: string | null
  birthday?: Date | null
  gender?: PetGender
  avatar_url?: string | null
  metadata?: Record<string, unknown> | null
}

type UpdatePetInput = Partial<CreatePetInput>

type CreateAuditLogInput = {
  actor_type: AuditActorType
  actor_id: string
  action: string
  target_type?: string | null
  target_id?: string | null
  before_state?: Record<string, unknown> | null
  after_state?: Record<string, unknown> | null
  ip_address?: string | null
  metadata?: Record<string, unknown> | null
}

type UpdateCustomerProfileInput = {
  birthday?: Date | null
  gender?: CustomerGender
  last_login_at?: Date | null
}

const CUSTOMER_LINKABLE_KEY = "customer_id"
const MEMBER_LEVEL_LINKABLE_KEY = "membership_member_level_id"

class MembershipModuleService extends MedusaService({
  MemberLevel,
  PointLog,
  Subscription,
  OAuthLink,
  Pet,
  Favorite,
  AuditLog,
  CustomerProfile,
}) {
  declare protected readonly __container__: Record<string, unknown>

  async createMemberLevel(
    data: CreateMemberLevelInput
  ): Promise<MemberLevelDTO> {
    return await super.createMemberLevels(data)
  }

  async updateMemberLevel(
    id: string,
    data: UpdateMemberLevelInput
  ): Promise<MemberLevelDTO> {
    const [memberLevel] = await super.updateMemberLevels({
      selector: { id },
      data,
    })

    if (!memberLevel) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Member level ${id} was not found`
      )
    }

    return memberLevel
  }

  async deleteMemberLevel(id: string): Promise<void> {
    await this.getLinkService().delete({
      [MEMBERSHIP_MODULE]: {
        [MEMBER_LEVEL_LINKABLE_KEY]: id,
      },
    })

    await super.deleteMemberLevels(id)
  }

  async adjustPoints(
    customer_id: string,
    delta: number,
    source: PointLogSource,
    reference_id?: string,
    note?: string
  ): Promise<PointLogDTO> {
    const previousLog = await this.getLatestPointLog(customer_id)
    const previousBalance = previousLog?.balance_after ?? 0
    const balance = previousBalance + delta

    if (balance < 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Insufficient points"
      )
    }

    return await super.createPointLogs({
      customer_id,
      points: delta,
      balance_after: balance,
      source,
      reference_id: reference_id ?? null,
      note: note ?? null,
      expired_at: null,
    })
  }

  async getCustomerPoints(
    customer_id: string
  ): Promise<{ balance: number; logs: PointLogDTO[] }> {
    const logs = await super.listPointLogs(
      { customer_id },
      {
        order: {
          created_at: "DESC",
          id: "DESC",
        },
      }
    )

    return {
      balance: logs[0]?.balance_after ?? 0,
      logs,
    }
  }

  async checkAndAutoUpgradeLevel(customer_id: string): Promise<void> {
    await this.getCustomerModuleService().retrieveCustomer(customer_id)
    await recalculateCustomerMembershipLevel(this.__container__ as never, {
      customerId: customer_id,
      actorType: "system",
      actorId: "system",
      reason: "membership_service_check_and_auto_upgrade",
      action: "customer.membership_level.recalculated_by_system",
    })
  }

  async getActiveSubscription(
    customer_id: string
  ): Promise<SubscriptionDTO | null> {
    const [subscription] = await super.listSubscriptions(
      {
        customer_id,
        status: "active",
      },
      {
        order: {
          started_at: "DESC",
          id: "DESC",
        },
        take: 1,
      }
    )

    return subscription ?? null
  }

  async createSubscription(
    customer_id: string,
    data: CreateSubscriptionInput
  ): Promise<SubscriptionDTO> {
    return await super.createSubscriptions({
      customer_id,
      ...data,
      expires_at: data.expires_at ?? null,
      next_billing_at: data.next_billing_at ?? null,
      billing_interval: data.billing_interval ?? null,
      amount: data.amount ?? null,
      metadata: data.metadata ?? null,
    })
  }

  async updateSubscription(
    id: string,
    data: UpdateSubscriptionInput
  ): Promise<SubscriptionDTO> {
    const [subscription] = await super.updateSubscriptions({
      selector: { id },
      data,
    })

    if (!subscription) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Subscription ${id} was not found`
      )
    }

    return subscription
  }

  async cancelSubscription(id: string): Promise<SubscriptionDTO> {
    return await this.updateSubscription(id, {
      status: "canceled",
    })
  }

  async linkOAuth(
    customer_id: string,
    provider: OAuthProvider,
    provider_user_id: string,
    tokenData: OAuthTokenData,
    rawProfile: JsonValue | null
  ): Promise<OAuthLinkDTO> {
    const [existingLink] = await super.listOAuthLinks(
      {
        customer_id,
        provider,
      },
      {
        take: 1,
      }
    )

    if (!existingLink) {
      return await super.createOAuthLinks({
        customer_id,
        provider,
        provider_user_id,
        provider_email: tokenData.provider_email ?? null,
        access_token: tokenData.access_token ?? null,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: tokenData.token_expires_at ?? null,
        raw_profile: rawProfile,
      })
    }

    const [oauthLink] = await super.updateOAuthLinks({
      selector: { id: existingLink.id },
      data: {
        provider_user_id,
        provider_email: tokenData.provider_email ?? null,
        access_token: tokenData.access_token ?? null,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: tokenData.token_expires_at ?? null,
        raw_profile: rawProfile,
      },
    })

    if (!oauthLink) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `OAuth link ${existingLink.id} was not found`
      )
    }

    return oauthLink
  }

  async unlinkOAuth(
    customer_id: string,
    provider: OAuthProvider
  ): Promise<void> {
    await super.deleteOAuthLinks({
      customer_id,
      provider,
    })
  }

  async findCustomerByOAuth(
    provider: OAuthProvider,
    provider_user_id: string
  ): Promise<string | null> {
    const [oauthLink] = await super.listOAuthLinks(
      {
        provider,
        provider_user_id,
      },
      {
        take: 1,
      }
    )

    return oauthLink?.customer_id ?? null
  }

  async createPet(customer_id: string, data: CreatePetInput): Promise<PetDTO> {
    return await super.createPets({
      customer_id,
      ...data,
      species: data.species ?? null,
      breed: data.breed ?? null,
      birthday: data.birthday ?? null,
      avatar_url: data.avatar_url ?? null,
      metadata: data.metadata ?? null,
    })
  }

  async updatePet(id: string, data: UpdatePetInput): Promise<PetDTO> {
    const [pet] = await super.updatePets({
      selector: { id },
      data,
    })

    if (!pet) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Pet ${id} was not found`
      )
    }

    return pet
  }

  async deletePet(id: string): Promise<void> {
    await super.deletePets(id)
  }

  async addFavorite(
    customer_id: string,
    product_id: string,
    variant_id?: string
  ): Promise<FavoriteDTO> {
    const [favorite] = await super.listFavorites(
      {
        customer_id,
        product_id,
        variant_id: variant_id ?? null,
      },
      {
        take: 1,
      }
    )

    if (favorite) {
      return favorite
    }

    return await super.createFavorites({
      customer_id,
      product_id,
      variant_id: variant_id ?? null,
    })
  }

  async removeFavorite(
    customer_id: string,
    product_id: string
  ): Promise<void> {
    await super.deleteFavorites({
      customer_id,
      product_id,
    })
  }

  async createAuditLog(data: CreateAuditLogInput): Promise<AuditLogDTO> {
    return await super.createAuditLogs({
      ...data,
      target_type: data.target_type ?? null,
      target_id: data.target_id ?? null,
      before_state: data.before_state ?? null,
      after_state: data.after_state ?? null,
      ip_address: data.ip_address ?? null,
      metadata: data.metadata ?? null,
    })
  }

  async getCustomerProfile(
    customer_id: string
  ): Promise<CustomerProfileDTO | null> {
    const [profile] = await super.listCustomerProfiles(
      {
        customer_id,
      },
      {
        take: 1,
      }
    )

    return profile ?? null
  }

  async upsertCustomerProfile(
    customer_id: string,
    data: UpdateCustomerProfileInput
  ): Promise<CustomerProfileDTO> {
    const existingProfile = await this.getCustomerProfile(customer_id)

    if (!existingProfile) {
      return await super.createCustomerProfiles({
        customer_id,
        birthday: data.birthday ?? null,
        gender: data.gender ?? "undisclosed",
        last_login_at: data.last_login_at ?? null,
      })
    }

    const [profile] = await super.updateCustomerProfiles({
      selector: {
        id: existingProfile.id,
      },
      data,
    })

    if (!profile) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Customer profile for ${customer_id} was not found`
      )
    }

    return profile
  }

  private getLinkService(): Link {
    return this.__container__[ContainerRegistrationKeys.LINK] as Link
  }

  private getCustomerModuleService(): ICustomerModuleService {
    return this.__container__[Modules.CUSTOMER] as ICustomerModuleService
  }

  private buildCustomerLevelLink(
    memberLevelId: string,
    customerId: string
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

  private extractMemberLevelId(link: LinkDefinition): string | null {
    const membershipLink = link[MEMBERSHIP_MODULE]

    if (!membershipLink) {
      return null
    }

    const value = membershipLink[MEMBER_LEVEL_LINKABLE_KEY]

    return typeof value === "string" ? value : null
  }

  private async listCustomerLevelLinks(
    customer_id: string,
    levels: MemberLevelDTO[]
  ): Promise<LinkDefinition[]> {
    if (!levels.length) {
      return []
    }

    const linkDefinitions = levels.map((level) =>
      this.buildCustomerLevelLink(level.id, customer_id)
    )

    return (await this.getLinkService().list(linkDefinitions, {
      asLinkDefinition: true,
    })) as LinkDefinition[]
  }

  private async getLatestPointLog(
    customer_id: string
  ): Promise<PointLogDTO | null> {
    const [pointLog] = await super.listPointLogs(
      { customer_id },
      {
        order: {
          created_at: "DESC",
          id: "DESC",
        },
        take: 1,
      }
    )

    return pointLog ?? null
  }
}

export default MembershipModuleService
