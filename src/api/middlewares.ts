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
  AdminProcessMembershipOrderRefund,
  AdminUpdateMemberLevel,
} from "./admin/membership/validators"
import { AdminUpdateCustomerMembership } from "./admin/customers/membership/validators"
import { pointsPaginationQueryConfig } from "./store/membership/query-config"
import {
  StoreCreateOrder,
  StoreLookupOrdersByPhone,
} from "./store/orders/validators"
import {
  StoreCustomerEmailVerificationConfirm,
  StoreCustomerEmailVerificationRequest,
  StoreCustomerLineComplete,
  StoreCustomerLogin,
  StoreCustomerPasswordResetConfirm,
  StoreCustomerPasswordResetRequest,
  StoreCustomerProfileUpdate,
  StoreCustomerPasswordResetValidate,
  StoreCustomerRegisterEmailStatus,
  StoreCustomerRegister,
} from "./store/customer-auth/validators"
import {
  StoreAddFavorite,
  StoreApplyMembershipPointRedemption,
  StoreCreatePet,
  StoreCreateSubscription,
  StoreGetCustomerPointsParams,
  StorePreviewMembershipPointRedemption,
  StoreUpdatePet,
  StoreUpdateSubscription,
} from "./store/membership/validators"

const adminAuth = authenticate("user", ["session", "bearer", "api-key"])
const customerAuth = authenticate("customer", ["session", "bearer"])
const optionalCustomerAuth = authenticate("customer", ["session", "bearer"], {
  allowUnauthenticated: true,
})

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/customers/:id/membership",
      methods: ["ALL"],
      middlewares: [adminAuth],
    },
    {
      matcher: "/admin/customers/:id/membership",
      methods: ["PATCH"],
      middlewares: [validateAndTransformBody(AdminUpdateCustomerMembership)],
    },
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
      matcher: "/admin/membership/orders/:id/refund",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminProcessMembershipOrderRefund)],
    },
    {
      matcher: "/store/auth/customer/status",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/orders",
      methods: ["POST"],
      middlewares: [
        optionalCustomerAuth,
        validateAndTransformBody(StoreCreateOrder),
      ],
    },
    {
      matcher: "/store/order-lookups",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(StoreLookupOrdersByPhone, {
          defaults: [],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/store/auth/customer/register",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerRegister)],
    },
    {
      matcher: "/store/auth/customer/register/email-status",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerRegisterEmailStatus)],
    },
    {
      matcher: "/store/auth/customer/login",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerLogin)],
    },
    {
      matcher: "/store/auth/customer/email-verification/request",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(StoreCustomerEmailVerificationRequest),
      ],
    },
    {
      matcher: "/store/auth/customer/email-verification/confirm",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(StoreCustomerEmailVerificationConfirm),
      ],
    },
    {
      matcher: "/store/auth/customer/password-reset/request",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerPasswordResetRequest)],
    },
    {
      matcher: "/store/auth/customer/password-reset/validate",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(StoreCustomerPasswordResetValidate),
      ],
    },
    {
      matcher: "/store/auth/customer/password-reset/confirm",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerPasswordResetConfirm)],
    },
    {
      matcher: "/store/auth/customer/line/complete",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerLineComplete)],
    },
    {
      matcher: "/store/customers/me/membership",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/orders",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/line/start",
      methods: ["ALL"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/profile",
      methods: ["GET"],
      middlewares: [optionalCustomerAuth],
    },
    {
      matcher: "/store/customers/me/profile",
      methods: ["POST"],
      middlewares: [customerAuth],
    },
    {
      matcher: "/store/customers/me/profile",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(StoreCustomerProfileUpdate)],
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
      matcher: "/store/customers/me/points/redeem-preview",
      methods: ["POST"],
      middlewares: [
        customerAuth,
        validateAndTransformBody(StorePreviewMembershipPointRedemption),
      ],
    },
    {
      matcher: "/store/customers/me/points/redeem",
      methods: ["POST"],
      middlewares: [
        customerAuth,
        validateAndTransformBody(StoreApplyMembershipPointRedemption),
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
