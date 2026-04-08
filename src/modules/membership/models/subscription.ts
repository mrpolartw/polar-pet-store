import { model } from "@medusajs/framework/utils"

import {
  BILLING_INTERVALS,
  SUBSCRIPTION_STATUSES,
} from "../constants"

const Subscription = model.define("membership_subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  plan_name: model.text(),
  status: model.enum([...SUBSCRIPTION_STATUSES]).default("active"),
  started_at: model.dateTime(),
  expires_at: model.dateTime().nullable(),
  next_billing_at: model.dateTime().nullable(),
  billing_interval: model.enum([...BILLING_INTERVALS]).nullable(),
  amount: model.number().nullable(),
  currency_code: model.text().default("TWD"),
  metadata: model.json().nullable(),
})

export default Subscription
