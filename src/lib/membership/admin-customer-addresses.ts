import type {
  ICustomerModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { toStoreCustomerAddress } from "../customer-auth/store-customer-addresses"

export type AdminCustomerAddressRecord = ReturnType<
  typeof toStoreCustomerAddress
>

function getCustomerModuleService(
  scope: MedusaContainer
): ICustomerModuleService {
  return scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

export async function listAdminCustomerAddresses(
  scope: MedusaContainer,
  customerId: string
): Promise<AdminCustomerAddressRecord[]> {
  const customerService = getCustomerModuleService(scope)
  const addresses = await customerService.listCustomerAddresses({
    customer_id: customerId,
  })

  return addresses.map((address) => toStoreCustomerAddress(address))
}
