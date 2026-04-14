import { loadEnv, defineConfig } from "@medusajs/framework/utils"

import { logDevelopmentAuthDiagnostics } from "./src/lib/customer-auth/dev-auth-diagnostics"

loadEnv(process.env.NODE_ENV || "development", process.cwd())
logDevelopmentAuthDiagnostics(process.env)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/membership",
    },
    {
      resolve: "@medusajs/notification",
      options: {
        providers: [
          {
            resolve: "./src/modules/notification/resend",
            id: "resend",
            options: {
              channels: ["email"],
              api_key: process.env.RESEND_API_KEY,
              from: `Mr. Polar 會員中心 <${process.env.RESEND_FROM_EMAIL}>`,
            },
          },
        ],
      },
    },
  ],
})
