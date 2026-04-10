import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { inspectCustomerPasswordResetToken } from "../../../../../../lib/customer-auth/email-auth"
import { getPasswordResetMessage } from "../../../../customer-auth/helpers"
import type { StoreCustomerPasswordResetValidateResponse } from "../../../../customer-auth/types"
import type { StoreCustomerPasswordResetValidateType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerPasswordResetValidateType>,
  res: MedusaResponse<StoreCustomerPasswordResetValidateResponse>
): Promise<void> {
  const result = await inspectCustomerPasswordResetToken(
    req.scope,
    req.validatedBody.token
  )

  res.json({
    status: result.status,
    message: getPasswordResetMessage(result.status),
  })
}
