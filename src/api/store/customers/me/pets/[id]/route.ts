import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensurePetOwnership,
  getCustomerId,
  getMembershipService,
  normalizePetPayload,
} from "../../../../membership/helpers"
import type {
  PetRecord,
  StoreCustomerPetResponse,
  StoreDeletedResponse,
} from "../../../../membership/types"
import type { StoreUpdatePetType } from "../../../../membership/validators"

export async function PATCH(
  req: AuthenticatedMedusaRequest<StoreUpdatePetType>,
  res: MedusaResponse<StoreCustomerPetResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)

  await ensurePetOwnership(req.scope, customerId, req.params.id)

  const pet = (await membershipService.updatePet(
    req.params.id,
    normalizePetPayload(req.validatedBody)
  )) as PetRecord

  res.status(200).json({
    pet,
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreDeletedResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)

  await ensurePetOwnership(req.scope, customerId, req.params.id)
  await membershipService.deletePet(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "pet",
    deleted: true,
  })
}
