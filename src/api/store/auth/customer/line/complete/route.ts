import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  establishCustomerSession,
  findCustomerAuthIdentityByCustomerId,
} from "../../../../../../lib/customer-auth/helpers"
import { completeLineCustomerRegistration } from "../../../../../../lib/customer-auth/line-auth"
import type { StoreCustomerLineCompleteResponse } from "../../../../customer-auth/types"
import type { StoreCustomerLineCompleteType } from "../../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerLineCompleteType>,
  res: MedusaResponse<StoreCustomerLineCompleteResponse>
): Promise<void> {
  const result = await completeLineCustomerRegistration(req.scope, {
    token: req.validatedBody.token,
    email: req.validatedBody.email,
    name: req.validatedBody.name ?? null,
  })

  const authIdentity = await findCustomerAuthIdentityByCustomerId(
    req.scope,
    result.customer_id
  )

  if (!authIdentity) {
    throw new Error("LINE 註冊完成，但找不到對應的會員帳號。")
  }

  establishCustomerSession(
    req,
    authIdentity,
    result.customer_id,
    result.user_metadata
  )

  res.json({
    customer_id: result.customer_id,
    redirect_to: result.redirect_to,
  })
}
