import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { requestCustomerPasswordReset } from "../../../../../../lib/customer-auth/email-auth"
import type { StoreCustomerPasswordResetRequestResponse } from "../../../../customer-auth/types"
import type { StoreCustomerPasswordResetRequestType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerPasswordResetRequestType>,
  res: MedusaResponse<StoreCustomerPasswordResetRequestResponse>
): Promise<void> {
  await requestCustomerPasswordReset(req.scope, req.validatedBody.email)

  res.json({
    message:
      "如果此 Email 已註冊，我們已寄出重設密碼信，請在 15 分鐘內完成重設。",
  })
}
