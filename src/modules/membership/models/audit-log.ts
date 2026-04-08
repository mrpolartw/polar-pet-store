import { model } from "@medusajs/framework/utils"

import { AUDIT_ACTOR_TYPES } from "../constants"

const AuditLog = model.define("membership_audit_log", {
  id: model.id().primaryKey(),
  actor_type: model.enum([...AUDIT_ACTOR_TYPES]),
  actor_id: model.text(),
  action: model.text(),
  target_type: model.text().nullable(),
  target_id: model.text().nullable(),
  before_state: model.json().nullable(),
  after_state: model.json().nullable(),
  ip_address: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default AuditLog
