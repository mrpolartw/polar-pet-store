import { model } from "@medusajs/framework/utils"

import { OAUTH_PROVIDERS } from "../constants"

const OAuthLink = model
  .define("membership_oauth_link", {
    id: model.id().primaryKey(),
    customer_id: model.text(),
    provider: model.enum([...OAUTH_PROVIDERS]),
    provider_user_id: model.text(),
    provider_email: model.text().nullable(),
    access_token: model.text().nullable(),
    refresh_token: model.text().nullable(),
    token_expires_at: model.dateTime().nullable(),
    raw_profile: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_membership_oauth_link_customer_provider",
      on: ["customer_id", "provider"],
      unique: true,
    },
    {
      name: "IDX_membership_oauth_link_provider_user_id",
      on: ["provider", "provider_user_id"],
      unique: true,
    },
  ])

export default OAuthLink
