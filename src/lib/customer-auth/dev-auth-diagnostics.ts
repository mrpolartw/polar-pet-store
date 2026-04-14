type OriginField = "STORE_CORS" | "ADMIN_CORS" | "AUTH_CORS"

type DiagnosticResult = {
  values: Record<OriginField, string>
  warnings: string[]
}

const COMMON_LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
]

function parseOrigins(value: string | undefined): string[] {
  return String(value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function findMissingOrigins(origins: string[], expectedOrigins: string[]) {
  return expectedOrigins.filter((origin) => !origins.includes(origin))
}

export function buildDevelopmentAuthDiagnostics(env: NodeJS.ProcessEnv): DiagnosticResult {
  const values = {
    STORE_CORS: env.STORE_CORS ?? "",
    ADMIN_CORS: env.ADMIN_CORS ?? "",
    AUTH_CORS: env.AUTH_CORS ?? "",
  }

  const warnings: string[] = []
  const storeOrigins = parseOrigins(values.STORE_CORS)
  const adminOrigins = parseOrigins(values.ADMIN_CORS)
  const authOrigins = parseOrigins(values.AUTH_CORS)

  const missingStoreOrigins = findMissingOrigins(storeOrigins, [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ])
  if (missingStoreOrigins.length) {
    warnings.push(
      `STORE_CORS 缺少常見前台來源：${missingStoreOrigins.join(", ")}`
    )
  }

  const missingAuthOrigins = findMissingOrigins(authOrigins, COMMON_LOCAL_ORIGINS)
  if (missingAuthOrigins.length) {
    warnings.push(
      `AUTH_CORS 缺少常見本地來源：${missingAuthOrigins.join(", ")}`
    )
  }

  const missingAdminOrigins = findMissingOrigins(adminOrigins, [
    "http://localhost:9000",
    "http://127.0.0.1:9000",
  ])
  if (missingAdminOrigins.length) {
    warnings.push(
      `ADMIN_CORS 缺少常見後台來源：${missingAdminOrigins.join(", ")}`
    )
  }

  return {
    values,
    warnings,
  }
}

export function logDevelopmentAuthDiagnostics(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV && env.NODE_ENV !== "development") {
    return
  }

  const diagnostics = buildDevelopmentAuthDiagnostics(env)

  console.info("[auth-diagnostics] development CORS 設定", diagnostics.values)
  console.info(
    "[auth-diagnostics] 前台會員登入使用 /store/auth/customer/login；Medusa 後台管理員登入使用 /auth/user/emailpass。"
  )

  diagnostics.warnings.forEach((warning) => {
    console.warn(`[auth-diagnostics] ${warning}`)
  })
}
