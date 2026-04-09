import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

// Medusa v2 正確寫法
export default async function orderNotificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) { 
  
  // 1. 取得 V2 的通知模組
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  
  // 2. 取得訂單模組，用 event 傳來的 id 去撈出真實的客戶 Email
  const orderModuleService = container.resolve(Modules.ORDER)
  const order = await orderModuleService.retrieveOrder(event.data.id)

  // 🚨 修正點：加上 !order.email 檢查
  // 如果訂單不存在，或是該訂單沒有留信箱，就直接停止執行
  if (!order || !order.email) {
    console.log(`⚠️ 略過發信：訂單 ${event.data.id} 不存在或沒有 Email 欄位。`)
    return
  }

  // 3. 使用 V2 的 createNotifications 發送
  await notificationModuleService.createNotifications({
    to: order.email, // 👈 TypeScript 現在確認這 100% 是字串了，不會再報錯！
    channel: "email",
    template: "order.created", 
    data: {
      order_id: order.id,
      customer_email: order.email,
      total: order.total,
    },
  })

  console.log(`訂單 ${order.id} 的通知信已透過 Resend 發送！`)
}

// 訂閱 order.placed 事件
export const config: SubscriberConfig = {
  event: "order.placed",
}