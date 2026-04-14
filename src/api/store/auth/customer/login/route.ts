import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { loginCustomerWithEmailPassword } from "../../../../../lib/customer-auth/email-auth"
import type { StoreCustomerLoginResponse } from "../../../customer-auth/types"
import type { StoreCustomerLoginType } from "../../../customer-auth/validators"

export async function POST(
  req: MedusaRequest<StoreCustomerLoginType>,
  res: MedusaResponse<StoreCustomerLoginResponse | Record<string, unknown>>
): Promise<void> {
  const result = await loginCustomerWithEmailPassword(
    req.scope,
    req,
    req.validatedBody
  )

  if (!result.success) {
    res.status(result.code === "EMAIL_NOT_VERIFIED" ? 403 : 401).json({
      success: false,
      auth_scope: "store_customer",
      code: result.code,
      message: result.message,
      email: result.email ?? null,
    })
    return
  }

  res.json({
    success: true,
    auth_scope: "store_customer",
    customer_id: result.customer_id,
  })
}
