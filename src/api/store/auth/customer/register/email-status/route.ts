import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { inspectCustomerRegisterEmailStatus } from "../../../../../../lib/customer-auth/email-auth"
import type { StoreCustomerRegisterEmailStatusResponse } from "../../../../customer-auth/types"
import type { StoreCustomerRegisterEmailStatusType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerRegisterEmailStatusType>,
  res: MedusaResponse<StoreCustomerRegisterEmailStatusResponse>
): Promise<void> {
  const result = await inspectCustomerRegisterEmailStatus(
    req.scope,
    req.validatedBody.email
  )

  const messageMap: Record<
    StoreCustomerRegisterEmailStatusResponse["status"],
    string
  > = {
    available: "此 Email 尚未註冊，可以繼續下一步。",
    registered_verified: "此 Email 已完成註冊，請直接登入使用。",
    registered_unverified:
      "此 Email 尚未完成驗證，已重新寄送驗證信，請前往信箱完成驗證。",
  }

  res.json({
    ...result,
    message: messageMap[result.status],
  })
}
