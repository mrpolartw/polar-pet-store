import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { issueLineOAuthStateToken } from "../../../../../../lib/customer-auth/line-auth"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { authorizationUrl } = await issueLineOAuthStateToken(req.scope, {
    mode: "login",
    redirectTo:
      typeof req.query.redirect_to === "string"
        ? req.query.redirect_to
        : undefined,
  })

  res.redirect(302, authorizationUrl)
}
