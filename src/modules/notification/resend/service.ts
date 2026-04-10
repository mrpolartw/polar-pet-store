import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import {
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"

type ResendOptions = {
  api_key: string
  from: string
}

export class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"

  protected resendClient: Resend
  protected options: ResendOptions

  constructor(container: any, options: ResendOptions) {
    super()
    this.options = options
    this.resendClient = new Resend(this.options.api_key)
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    try {
      const { data, error } = await this.resendClient.emails.send({
        from: this.options.from,
        to: notification.to,
        subject: (notification.data?.title as string) || "Mr. Polar 通知",
        html:
          (notification.data?.description as string) ||
          "<p>這是一封來自 Mr. Polar 的系統通知。</p>",
      })

      if (error) {
        console.error("Resend API 錯誤:", error)
        throw new Error(error.message)
      }

      return { id: data?.id || "unknown_id" }
    } catch (error) {
      console.error("寄送 Resend 郵件時發生錯誤:", error)
      throw error
    }
  }
}
