import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getCustomerId,
  getMembershipService,
  normalizePetPayload,
} from "../../../membership/helpers"
import type {
  PetRecord,
  StoreCustomerPetResponse,
  StoreCustomerPetsResponse,
} from "../../../membership/types"
import type {
  StoreCreatePetType,
} from "../../../membership/validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreCustomerPetsResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const items = (await membershipService.listPets(
    { customer_id: customerId },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )) as PetRecord[]

  res.json({
    items,
    count: items.length,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreatePetType>,
  res: MedusaResponse<StoreCustomerPetResponse>
): Promise<void> {
  const customerId = getCustomerId(req)
  const membershipService = getMembershipService(req.scope)
  const petPayload = normalizePetPayload(req.validatedBody)
  const pet = (await membershipService.createPet(
    customerId,
    {
      ...petPayload,
      name: req.validatedBody.name,
    }
  )) as PetRecord

  await membershipService.createAuditLog({
    actor_type: "customer",
    actor_id: customerId,
    action: "customer.pet.created",
    target_type: "customer",
    target_id: customerId,
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
