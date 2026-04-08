import { model } from "@medusajs/framework/utils"

import { POINT_LOG_SOURCES } from "../constants"

const PointLog = model.define("membership_point_log", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  points: model.number(),
  balance_after: model.number().default(0),
  source: model.enum([...POINT_LOG_SOURCES]),
  reference_id: model.text().nullable(),
  note: model.text().nullable(),
  expired_at: model.dateTime().nullable(),
})

export default PointLog
