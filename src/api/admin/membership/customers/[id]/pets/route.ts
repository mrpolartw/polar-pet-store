import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureMembershipCustomer,
  getMembershipService,
} from "../../../helpers"
import type {
  AdminMembershipCustomerPetsResponse,
  PetRecord,
} from "../../../types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminMembershipCustomerPetsResponse>
): Promise<void> {
  await ensureMembershipCustomer(req.scope, req.params.id)

  const membershipService = getMembershipService(req.scope)
  const pets = (await membershipService.listPets(
    { customer_id: req.params.id },
    {
      order: {
        created_at: "DESC",
        id: "DESC",
      },
    }
  )) as PetRecord[]

  res.json({
    pets,
    count: pets.length,
  })
}
