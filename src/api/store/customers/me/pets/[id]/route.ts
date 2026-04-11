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

  const existingPet = await ensurePetOwnership(req.scope, customerId, req.params.id)

  const pet = (await membershipService.updatePet(
    req.params.id,
    normalizePetPayload(req.validatedBody)
  )) as PetRecord

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.pet.updated",
    target_type: "customer",
    target_id: customerId,
    before_state: {
      pet_id: existingPet.id,
      name: existingPet.name,
      species: existingPet.species,
      gender: existingPet.gender,
    },
    after_state: {
      pet_id: pet.id,
      name: pet.name,
      species: pet.species,
      gender: pet.gender,
    },
  })

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

  const pet = await ensurePetOwnership(req.scope, customerId, req.params.id)
  await membershipService.deletePet(req.params.id)
  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.pet.deleted",
    target_type: "customer",
    target_id: customerId,
    before_state: {
      pet_id: pet.id,
      name: pet.name,
      species: pet.species,
      gender: pet.gender,
    },
  })

  res.status(200).json({
    id: req.params.id,
    object: "pet",
    deleted: true,
  })
}
