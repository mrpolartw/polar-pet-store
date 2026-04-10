
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listPublishableKeys({ container }: { container: MedusaContainer }) {
  const service = container.resolve(Modules.API_KEY)
  const keys = await service.listApiKeys({
    type: "publishable",
  })

  console.log("Publishable Keys:", JSON.stringify(keys, null, 2))
}
