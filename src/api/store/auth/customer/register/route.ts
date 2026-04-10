import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { registerCustomerEmailAccount } from "../../../../../lib/customer-auth/email-auth"
import type { StoreCustomerRegisterResponse } from "../../../customer-auth/types"
import type { StoreCustomerRegisterType } from "../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerRegisterType>,
  res: MedusaResponse<StoreCustomerRegisterResponse>
): Promise<void> {
  const result = await registerCustomerEmailAccount(req.scope, req, {
    ...req.validatedBody,
    gender: req.validatedBody.gender ?? undefined,
  })

  res.status(201).json({
    ...result,
    message: "註冊成功，請前往信箱完成 Email 驗證後再登入。",
  })
}
