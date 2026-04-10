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
      ? "這個 Email 已經完成驗證，請直接登入。"
      : "如果此 Email 已註冊，我們已重新寄出驗證信，請前往信箱確認。",
  })
}
