import { model } from "@medusajs/framework/utils"
import { CUSTOMER_GENDERS } from "../../../lib/membership/customer-gender"

const CustomerProfile = model.define("membership_customer_profile", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  birthday: model.dateTime().nullable(),
  gender: model.enum([...CUSTOMER_GENDERS]).default("unknown"),
  last_login_at: model.dateTime().nullable(),
})

export default CustomerProfile
