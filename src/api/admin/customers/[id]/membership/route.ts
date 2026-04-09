import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  retrieveAdminCustomerMembershipDetail,
  updateAdminCustomerMembership,
} from "../../../../../lib/membership/admin-customer-membership"
import type { AdminCustomerMembershipDetailResponse } from "../../../../../lib/membership/customer-membership-detail"
import type { AdminUpdateCustomerMembershipType } from "../../membership/validators"

function getRequestIpAddress(req: AuthenticatedMedusaRequest): string | null {
  const requestWithIp = req as AuthenticatedMedusaRequest & { ip?: string }

  return requestWithIp.ip ?? null
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminCustomerMembershipDetailResponse>
): Promise<void> {
  const membership = await retrieveAdminCustomerMembershipDetail(
    req.scope,
    req.params.id
  )

  res.status(200).json({ membership })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest & {
    validatedBody: AdminUpdateCustomerMembershipType
  },
  res: MedusaResponse<AdminCustomerMembershipDetailResponse>
): Promise<void> {
  const membership = await updateAdminCustomerMembership(req.scope, {
    customerId: req.params.id,
    actorId: req.auth_context.actor_id,
    ipAddress: getRequestIpAddress(req),
    payload: req.validatedBody,
  })

  res.status(200).json({ membership })
}
