import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa/utils"
import {
  adminMembershipAuditLogListQueryConfig,
  adminMembershipCustomerListQueryConfig,
  adminMembershipMemberLevelListQueryConfig,
  adminMembershipPointLogListQueryConfig,
} from "./admin/membership/query-config"
import {
  AdminAdjustMembershipPoints,
  AdminAssignMembershipLevel,
  AdminCreateMemberLevel,
  AdminGetMembershipCustomerAuditLogsParams,
  AdminGetMembershipCustomerPointsParams,
  AdminGetMembershipCustomersParams,
  AdminGetMembershipMemberLevelsParams,
  AdminUpdateMemberLevel,
} from "./admin/membership/validators"
import { pointsPaginationQueryConfig } from "./store/membership/query-config"
import {
  StoreAddFavorite,
  StoreCreatePet,
  StoreCreateSubscription,
  StoreGetCustomerPointsParams,
  StoreUpdatePet,
  StoreUpdateSubscription,
} from "./store/membership/validators"

const adminAuth = authenticate("user", ["session", "bearer", "api-key"])
const customerAuth = authenticate("customer", ["session", "bearer"])

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/membership/*",
      methods: ["ALL"],
      middlewares: [adminAuth],
    },
    {
      matcher: "/admin/membership/member-levels",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(
          AdminGetMembershipMemberLevelsParams,
          adminMembershipMemberLevelListQueryConfig
        ),
      ],
    },
    {
      matcher: "/admin/membership/member-levels",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreateMemberLevel)],
    },
    {
      matcher: "/admin/membership/member-levels/:id",
      methods: ["PATCH"],
      middlewares: [validateAndTransformBody(AdminUpdateMemberLevel)],
    },
    {
      matcher: "/admin/membership/customers",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(
          AdminGetMembershipCustomersParams,
          adminMembershipCustomerListQueryConfig
        ),
      ],
    },
    {
      matcher: "/admin/membership/customers/:id/points",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(
          AdminGetMembershipCustomerPointsParams,
          adminMembershipPointLogListQueryConfig
        ),
      ],
    },
    {
      matcher: "/admin/membership/customers/:id/audit-logs",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(
          AdminGetMembershipCustomerAuditLogsParams,
          adminMembershipAuditLogListQueryConfig
        ),
      ],
    },
    {
      matcher: "/admin/membership/customers/:id/points/adjust",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminAdjustMembershipPoints)],
    },
    {
      matcher: "/admin/membership/customers/:id/assign-level",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminAssignMembershipLevel)],
    },
    {
      matcher: "/store/customers/me/membership",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/points",
      methods: ["GET"],
      middlewares: [
        customerAuth,
        validateAndTransformQuery(
          StoreGetCustomerPointsParams,
          pointsPaginationQueryConfig
        ),
      ],
    },
    {
      matcher: "/store/customers/me/favorites",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/favorites",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreAddFavorite)],
    },
    {
      matcher: "/store/customers/me/favorites/:product_id",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/pets",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/pets",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCreatePet)],
    },
    {
      matcher: "/store/customers/me/pets/:id",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/pets/:id",
      methods: ["PATCH"],
      middlewares: [validateAndTransformBody(StoreUpdatePet)],
    },
    {
      matcher: "/store/subscriptions*",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/subscriptions",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCreateSubscription)],
    },
    {
      matcher: "/store/subscriptions/:id",
      methods: ["PATCH"],
      middlewares: [validateAndTransformBody(StoreUpdateSubscription)],
    },
  ],
})
