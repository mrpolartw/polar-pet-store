import { model } from "@medusajs/framework/utils"

import { CUSTOMER_AUTH_TOKEN_TYPES } from "../constants"

const CustomerAuthToken = model
  .define("membership_customer_auth_token", {
    id: model.id().primaryKey(),
    customer_id: model.text().nullable(),
    auth_identity_id: model.text().nullable(),
    token_type: model.enum([...CUSTOMER_AUTH_TOKEN_TYPES]),
    token_hash: model.text(),
    expires_at: model.dateTime(),
    used_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_membership_customer_auth_token_hash",
      on: ["token_hash"],
      unique: true,
    },
    {
      name: "IDX_membership_customer_auth_token_customer_type",
      on: ["customer_id", "token_type"],
    },
    {
      name: "IDX_membership_customer_auth_token_auth_identity_type",
      on: ["auth_identity_id", "token_type"],
    },
  ])

export default CustomerAuthToken
