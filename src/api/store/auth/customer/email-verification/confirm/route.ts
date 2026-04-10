import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { confirmCustomerEmailVerification } from "../../../../../../lib/customer-auth/email-auth"
import { getEmailVerificationMessage } from "../../../../customer-auth/helpers"
import type { StoreCustomerEmailVerificationConfirmResponse } from "../../../../customer-auth/types"
import type { StoreCustomerEmailVerificationConfirmType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerEmailVerificationConfirmType>,
  res: MedusaResponse<StoreCustomerEmailVerificationConfirmResponse>
): Promise<void> {
  const result = await confirmCustomerEmailVerification(
    req.scope,
    req.validatedBody.token
  )

  res.json({
    status: result.status,
    message: getEmailVerificationMessage(result.status),
  })
}
