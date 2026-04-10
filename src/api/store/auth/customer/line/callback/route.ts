import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { buildStorefrontUrl } from "../../../../../../lib/customer-auth/config"
import {
  establishCustomerSession,
  findCustomerAuthIdentityByCustomerId,
} from "../../../../../../lib/customer-auth/helpers"
import { resolveLineCustomerAuthentication } from "../../../../../../lib/customer-auth/line-auth"

function buildLineErrorRedirect(code: string): string {
  return buildStorefrontUrl("login", {
    line_error: code,
  })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const code = typeof req.query.code === "string" ? req.query.code : null
  const state = typeof req.query.state === "string" ? req.query.state : null

  if (!code || !state) {
    res.redirect(302, buildLineErrorRedirect("invalid_callback"))
    return
  }

  try {
    const result = await resolveLineCustomerAuthentication(req.scope, {
      code,
      state,
    })

    if (result.status === "pending_email") {
      res.redirect(302, result.redirect_to)
      return
    }

    const authIdentity = await findCustomerAuthIdentityByCustomerId(
      req.scope,
      result.customer_id
    )

    if (!authIdentity) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "LINE 登入成功，但找不到對應的會員帳號。"
      )
    }

    establishCustomerSession(
      req,
      authIdentity,
      result.customer_id,
      result.user_metadata
    )

    res.redirect(302, result.redirect_to)
  } catch (error) {
    const code =
      error instanceof MedusaError &&
      error.type === MedusaError.Types.INVALID_DATA
        ? "line_auth_failed"
        : "line_unexpected_error"

    res.redirect(302, buildLineErrorRedirect(code))
  }
}
