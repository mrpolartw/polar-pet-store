import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { confirmCustomerPasswordReset } from "../../../../../../lib/customer-auth/email-auth"
import { getPasswordResetMessage } from "../../../../customer-auth/helpers"
import type { StoreCustomerPasswordResetConfirmResponse } from "../../../../customer-auth/types"
import type { StoreCustomerPasswordResetConfirmType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerPasswordResetConfirmType>,
  res: MedusaResponse<StoreCustomerPasswordResetConfirmResponse>
): Promise<void> {
  const result = await confirmCustomerPasswordReset(req.scope, {
    token: req.validatedBody.token,
    password: req.validatedBody.password,
  })

  res.json({
    status: result.status,
    message: getPasswordResetMessage(result.status),
  })
}
