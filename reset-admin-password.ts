import { Modules } from "@medusajs/framework/utils"

const ADMIN_EMAIL = "test@gmail.com"
const ADMIN_PASSWORD = "test123"

export default async function resetAdminPassword({ container }) {
  const authModule = container.resolve(Modules.AUTH)
  const userModule = container.resolve(Modules.USER)

  let user = (await userModule.listUsers({ email: ADMIN_EMAIL }))[0]

  if (!user) {
    user = await userModule.createUsers({
      email: ADMIN_EMAIL,
      first_name: "Test",
      last_name: "Admin",
    })
    console.log(`已建立後台使用者：${ADMIN_EMAIL}`)
  } else {
    console.log(`已找到後台使用者：${ADMIN_EMAIL} (${user.id})`)
  }

  const existingAuthIdentity = (
    await authModule.listAuthIdentities({
      provider_identities: {
        entity_id: ADMIN_EMAIL,
        provider: "emailpass",
      },
    })
  )[0]

  let authIdentityId = existingAuthIdentity?.id

  if (!authIdentityId) {
    const registerResult = await authModule.register("emailpass", {
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    })

    if (!registerResult.success || !registerResult.authIdentity?.id) {
      throw new Error(registerResult.error || "建立 emailpass 登入失敗")
    }

    authIdentityId = registerResult.authIdentity.id
    console.log(`已建立 emailpass 登入：${ADMIN_EMAIL}`)
  } else {
    const updateResult = await authModule.updateProvider("emailpass", {
      entity_id: ADMIN_EMAIL,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    if (!updateResult.success) {
      throw new Error(updateResult.error || "更新 emailpass 密碼失敗")
    }

    console.log(`已更新 emailpass 密碼：${ADMIN_EMAIL}`)
  }

  await authModule.updateAuthIdentities({
    id: authIdentityId,
    app_metadata: {
      user_id: user.id,
    },
  })

  console.log(`後台帳號已可登入：${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}
