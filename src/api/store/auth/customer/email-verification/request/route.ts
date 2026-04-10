import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { requestCustomerEmailVerification } from "../../../../../../lib/customer-auth/email-auth"
import type { StoreCustomerEmailVerificationRequestResponse } from "../../../../customer-auth/types"
import type { StoreCustomerEmailVerificationRequestType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerEmailVerificationRequestType>,
  res: MedusaResponse<StoreCustomerEmailVerificationRequestResponse>
): Promise<void> {
  const result = await requestCustomerEmailVerification(
    req.scope,
    req.validatedBody.email
  )

  res.json({
    ...result,
    message: result.email_verified
      ? "此 Email 已完成驗證，請直接登入。"
      : "驗證信已重新寄出，請前往信箱完成驗證。",
  })
}
