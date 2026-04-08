import { model } from "@medusajs/framework/utils"

import { PET_GENDERS, PET_SPECIES } from "../constants"

const Pet = model.define("membership_pet", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  name: model.text(),
  species: model.enum([...PET_SPECIES]).nullable(),
  breed: model.text().nullable(),
  birthday: model.dateTime().nullable(),
  gender: model.enum([...PET_GENDERS]).default("unknown"),
  avatar_url: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default Pet
