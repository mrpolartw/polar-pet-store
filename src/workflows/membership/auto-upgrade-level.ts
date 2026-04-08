import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type { Link } from "@medusajs/modules-sdk"
import type MembershipModuleService from "../../modules/membership/service"
import { MEMBERSHIP_MODULE } from "../../modules/membership"
import { retrieveCustomerWithMembershipLevel } from "../../lib/membership/customer-membership"

type AutoUpgradeLevelWorkflowInput = {
  customer_id: string
}

type GetCustomerPointsStepInput = AutoUpgradeLevelWorkflowInput
type GetCustomerPointsStepOutput = {
  balance: number
}

type GetEligibleLevelStepInput = GetCustomerPointsStepOutput
type GetEligibleLevelStepOutput = {
  eligible_level_id: string | null
}

type GetCurrentLevelStepInput = AutoUpgradeLevelWorkflowInput
type GetCurrentLevelStepOutput = {
  current_level_id: string | null
}

type UpdateLevelIfChangedStepInput = AutoUpgradeLevelWorkflowInput &
  GetEligibleLevelStepOutput &
  GetCurrentLevelStepOutput

type UpdateLevelIfChangedStepOutput = {
  upgraded: boolean
  new_level_id: string | null
}

const getCustomerPointsStep = createStep(
  "membership-get-customer-points",
  async (
    input: GetCustomerPointsStepInput,
    { container }
  ): Promise<StepResponse<GetCustomerPointsStepOutput>> => {
    const membershipService =
      container.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
    const { balance } = await membershipService.getCustomerPoints(
      input.customer_id
    )

    return new StepResponse({
      balance,
    })
  }
)

const getEligibleLevelStep = createStep(
  "membership-get-eligible-level",
  async (
    input: GetEligibleLevelStepInput,
    { container }
  ): Promise<StepResponse<GetEligibleLevelStepOutput>> => {
    const membershipService =
      container.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)
    const levels = await membershipService.listMemberLevels(
      { is_active: true },
      {
        order: {
          rank: "DESC",
          min_points: "DESC",
          id: "DESC",
        },
      }
    )

    const eligibleLevel =
      levels.find((level) => level.min_points <= input.balance) ?? null

    return new StepResponse({
      eligible_level_id: eligibleLevel?.id ?? null,
    })
  }
)

const getCurrentLevelStep = createStep(
  "membership-get-current-level",
  async (
    input: GetCurrentLevelStepInput,
    { container }
  ): Promise<StepResponse<GetCurrentLevelStepOutput>> => {
    const customer = await retrieveCustomerWithMembershipLevel(
      container,
      input.customer_id
    )

    return new StepResponse({
      current_level_id: customer?.membership_member_level?.id ?? null,
    })
  }
)

const updateLevelIfChangedStep = createStep(
  "membership-update-level-if-changed",
  async (
    input: UpdateLevelIfChangedStepInput,
    { container }
  ): Promise<StepResponse<UpdateLevelIfChangedStepOutput>> => {
    if (
      !input.eligible_level_id ||
      input.eligible_level_id === input.current_level_id
    ) {
      return new StepResponse({
        upgraded: false,
        new_level_id: input.current_level_id ?? input.eligible_level_id ?? null,
      })
    }

    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
    const membershipService =
      container.resolve<MembershipModuleService>(MEMBERSHIP_MODULE)

    if (input.current_level_id) {
      await link.dismiss([
        {
          [MEMBERSHIP_MODULE]: {
            membership_member_level_id: input.current_level_id,
          },
          [Modules.CUSTOMER]: {
            customer_id: input.customer_id,
          },
        },
      ])
    }

    await link.create([
      {
        [MEMBERSHIP_MODULE]: {
          membership_member_level_id: input.eligible_level_id,
        },
        [Modules.CUSTOMER]: {
          customer_id: input.customer_id,
        },
      },
    ])

    await membershipService.createAuditLog({
      actor_type: "system",
      actor_id: "system",
      action: "AUTO_UPGRADE_LEVEL",
      target_type: "customer",
      target_id: input.customer_id,
      before_state: { level_id: input.current_level_id },
      after_state: { level_id: input.eligible_level_id },
    })

    return new StepResponse({
      upgraded: true,
      new_level_id: input.eligible_level_id,
    })
  }
)

export const autoUpgradeLevelWorkflow = createWorkflow(
  "membership-auto-upgrade-level",
  (input: AutoUpgradeLevelWorkflowInput) => {
    const customerPoints = getCustomerPointsStep(input)
    const eligibleLevel = getEligibleLevelStep(customerPoints)
    const currentLevel = getCurrentLevelStep(input)
    const result = updateLevelIfChangedStep({
      customer_id: input.customer_id,
      eligible_level_id: eligibleLevel.eligible_level_id,
      current_level_id: currentLevel.current_level_id,
    })

    return new WorkflowResponse(result)
  }
)
