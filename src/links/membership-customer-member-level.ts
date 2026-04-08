import CustomerModule from "@medusajs/medusa/customer"
import { defineLink } from "@medusajs/framework/utils"

import MembershipModule from "../modules/membership"

export default defineLink(
  MembershipModule.linkable.membershipMemberLevel,
  {
    linkable: CustomerModule.linkable.customer,
    isList: true,
  },
  {
    database: {
      table: "membership_customer_member_level_link",
    },
  }
)
