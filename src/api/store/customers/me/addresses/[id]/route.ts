import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type {
  CustomerAddressDTO,
  ICustomerModuleService,
} from "@medusajs/framework/types"
import type {
  StoreCustomerAddressResponse,
} from "../../../types"
import type { StoreDeletedResponse } from "../../../../membership/types"
import type { StoreUpdateCustomerAddressType } from "../../../validators"
import {
  assertAddressOwnership,
  ensureSingleDefaultAddress,
  normalizeStoreCustomerAddressUpdatePayload,
  toStoreCustomerAddress,
} from "../../../../../../lib/customer-auth/store-customer-addresses"

function getCustomerService(
  req: AuthenticatedMedusaRequest
): ICustomerModuleService {
  return req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
}

function getCustomerId(req: AuthenticatedMedusaRequest): string {
  return req.auth_context.actor_id
}

async function retrieveCustomerAddress(
  customerService: ICustomerModuleService,
  customerId: string,
  addressId: string
): Promise<CustomerAddressDTO> {
  const [address] = await customerService.listCustomerAddresses(
    {
      id: addressId,
      customer_id: customerId,
    },
    {
      take: 1,
    }
  )

  assertAddressOwnership(address, customerId)
  return address
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<StoreUpdateCustomerAddressType>,
  res: MedusaResponse<StoreCustomerAddressResponse>
): Promise<void> {
  const customerService = getCustomerService(req)
  const customerId = getCustomerId(req)
  const currentAddress = await retrieveCustomerAddress(
    customerService,
    customerId,
    req.params.id
  )
  const nextType =
    req.validatedBody.type ??
    (((currentAddress.metadata as Record<string, unknown> | null)?.type === "711"
      ? "711"
      : "home") as "home" | "711")

  await ensureSingleDefaultAddress({
    customerService,
    customerId,
    excludedAddressId: currentAddress.id,
    nextDefault: Boolean(req.validatedBody.is_default),
  })

  const address = await customerService.updateCustomerAddresses(
    req.params.id,
    normalizeStoreCustomerAddressUpdatePayload({
      type: nextType,
      label: req.validatedBody.label ?? null,
      name:
        req.validatedBody.name ??
        [currentAddress.first_name, currentAddress.last_name]
          .filter(Boolean)
          .join(" ")
          .trim(),
      phone: req.validatedBody.phone ?? currentAddress.phone ?? "",
      city: req.validatedBody.city ?? currentAddress.city ?? null,
      district:
        req.validatedBody.district ??
        (typeof (currentAddress.metadata as Record<string, unknown> | null)?.district ===
        "string"
          ? ((currentAddress.metadata as Record<string, unknown>).district as string)
          : currentAddress.province ?? null),
      address: req.validatedBody.address ?? currentAddress.address_1 ?? null,
      is_default:
        req.validatedBody.is_default ??
        Boolean(
          currentAddress.is_default_shipping || currentAddress.is_default_billing
        ),
      store_name:
        req.validatedBody.store_name ??
        (typeof (currentAddress.metadata as Record<string, unknown> | null)?.store_name ===
        "string"
          ? ((currentAddress.metadata as Record<string, unknown>).store_name as string)
          : null),
      store_id:
        req.validatedBody.store_id ??
        (typeof (currentAddress.metadata as Record<string, unknown> | null)?.store_id ===
        "string"
          ? ((currentAddress.metadata as Record<string, unknown>).store_id as string)
          : null),
    })
  )

  res.status(200).json({
    address: toStoreCustomerAddress(address),
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreDeletedResponse>
): Promise<void> {
  const customerService = getCustomerService(req)
  const customerId = getCustomerId(req)

  await retrieveCustomerAddress(customerService, customerId, req.params.id)
  await customerService.deleteCustomerAddresses(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "customer_address",
    deleted: true,
  })
}
