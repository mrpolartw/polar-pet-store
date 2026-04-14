import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { ICustomerModuleService } from "@medusajs/framework/types"
import type {
  StoreCustomerAddressResponse,
  StoreCustomerAddressesResponse,
} from "../../types"
import type { StoreCreateCustomerAddressType } from "../../validators"
import {
  ensureSingleDefaultAddress,
  normalizeStoreCustomerAddressPayload,
  toStoreCustomerAddress,
} from "../../../../../lib/customer-auth/store-customer-addresses"

function getCustomerService(
  req: AuthenticatedMedusaRequest
): ICustomerModuleService {
  return req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

function getCustomerId(req: AuthenticatedMedusaRequest): string {
  return req.auth_context.actor_id
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerAddressesResponse>
): Promise<void> {
  const customerService = getCustomerService(req)
  const customerId = getCustomerId(req)
  const addresses = await customerService.listCustomerAddresses(
    { customer_id: customerId },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )

  res.json({
    items: addresses.map(toStoreCustomerAddress),
    count: addresses.length,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreateCustomerAddressType>,
  res: MedusaResponse<StoreCustomerAddressResponse>
): Promise<void> {
  const customerService = getCustomerService(req)
  const customerId = getCustomerId(req)

  await ensureSingleDefaultAddress({
    customerService,
    customerId,
    nextDefault: Boolean(req.validatedBody.is_default),
  })

  const address = await customerService.createCustomerAddresses(
    normalizeStoreCustomerAddressPayload({
      customerId,
      payload: {
        ...req.validatedBody,
        is_default: Boolean(req.validatedBody.is_default),
      },
    })
  )

  res.status(200).json({
    address: toStoreCustomerAddress(address),
  })
}
