import type { MedusaContainer } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type { CustomerMembershipLevelRecalculationResult } from "../../lib/membership/customer-membership-level"
import { recalculateCustomerMembershipLevel } from "../../lib/membership/customer-membership-level"

type AutoUpgradeLevelWorkflowInput = {
  customer_id: string
  reason?: string
}

const recalculateCustomerMembershipLevelStep = createStep(
  "membership-recalculate-customer-membership-level",
  async (
    input: AutoUpgradeLevelWorkflowInput,
    { container }
  ): Promise<StepResponse<CustomerMembershipLevelRecalculationResult>> => {
    const result = await recalculateCustomerMembershipLevel(
      container as MedusaContainer,
      {
        customerId: input.customer_id,
        actorType: "system",
        actorId: "system",
        reason: input.reason ?? "membership_auto_upgrade_workflow",
        action: "customer.membership_level.recalculated_by_system",
      }
    )

    return new StepResponse(result)
  }
)

export const autoUpgradeLevelWorkflow = createWorkflow(
  "membership-auto-upgrade-level",
  (input: AutoUpgradeLevelWorkflowInput) => {
    const result = recalculateCustomerMembershipLevelStep(input)

    return new WorkflowResponse(result)
  }
)
