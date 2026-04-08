import { model } from "@medusajs/framework/utils"

const Favorite = model.define("membership_favorite", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
})

export default Favorite
