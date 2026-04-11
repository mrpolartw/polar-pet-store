import { Modules } from "@medusajs/framework/utils"
import {
  createCustomerAccountWithIdentity,
  findCustomerAuthIdentityByEmail,
  findCustomerByEmail,
  getMembershipService,
} from "./src/lib/customer-auth/helpers"

const EMAIL = "test@gmail.com"
const NAME = "Test Customer"

export default async function ensureTestCustomer({ container, scope }) {
  const customerScope = scope ?? container
  const authModule = customerScope.resolve(Modules.AUTH)
  const existingAuthIdentity = await findCustomerAuthIdentityByEmail(customerScope, EMAIL)

  if (!existingAuthIdentity?.id) {
    throw new Error(`找不到 ${EMAIL} 的 emailpass auth identity，請先執行 reset-admin-password.ts`) 
  }

  const existingCustomer = await findCustomerByEmail(customerScope, EMAIL)

  const customer = existingCustomer ?? await createCustomerAccountWithIdentity(customerScope, {
    authIdentityId: existingAuthIdentity.id,
    email: EMAIL,
    name: NAME,
    phone: null,
    birthday: null,
    gender: 'undisclosed',
    emailVerifiedAt: new Date(),
  })

  await authModule.updateAuthIdentities({
    id: existingAuthIdentity.id,
    app_metadata: {
      ...(existingAuthIdentity.app_metadata ?? {}),
      customer_id: customer.id,
    },
  })

  await getMembershipService(customerScope).upsertCustomerProfile(customer.id, {
    email_verified_at: new Date(),
  })

  console.log(`前台 customer 帳號已可登入：${EMAIL} (${customer.id})`)
}
