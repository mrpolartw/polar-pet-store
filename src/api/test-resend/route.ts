import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  // 直接呼叫我們剛剛掛載好的 Notification 模組
  const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  
  try {
    await notificationModuleService.createNotifications({
      to: "m11423024@yuntech.edu.tw", // 你的信箱
      channel: "email",
      template: "test-direct", 
      data: {
        title: "Medusa v2 直接發送測試！",
        description: "恭喜！當你看到這封信，代表你的 Resend Provider 已經完美運作，隨時可以為真實訂單服務了！🚀",
      },
    })

    console.log("✅ 測試信已經直接發送給 Resend！")
    res.json({ message: "寄信指令已成功發送！請檢查你的終端機與電子信箱。" })
    
  } catch (error) {
    console.error("❌ 發送失敗：", error)
    res.json({ message: "發送失敗，請看終端機的錯誤訊息" })
  }
}