import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type CustomerAuthEmailInput = {
  to: string
  subject: string
  heading: string
  intro: string
  ctaLabel: string
  ctaUrl: string
  supportText?: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildCustomerAuthEmailHtml(input: CustomerAuthEmailInput): string {
  const supportText = input.supportText
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.8;color:#6b7280;">${escapeHtml(
        input.supportText
      )}</p>`
    : ""

  return `
    <div style="background:#f5f6f8;padding:32px 16px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;color:#111827;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
        <div style="font-size:13px;letter-spacing:0.08em;color:#9ca3af;margin-bottom:12px;">Mr. Polar 會員中心</div>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.35;color:#0f172a;">${escapeHtml(
          input.heading
        )}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#374151;">${escapeHtml(
          input.intro
        )}</p>
        <div style="margin:0 0 24px;">
          <a href="${escapeHtml(
            input.ctaUrl
          )}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#003153;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.8;color:#6b7280;">如果按鈕無法開啟，請直接複製以下連結到瀏覽器：</p>
        <p style="margin:8px 0 0;font-size:13px;line-height:1.8;word-break:break-all;color:#003153;">${escapeHtml(
          input.ctaUrl
        )}</p>
        ${supportText}
      </div>
    </div>
  `
}

export async function sendCustomerAuthEmail(
  scope: MedusaContainer,
  input: CustomerAuthEmailInput
): Promise<void> {
  const notificationService = scope.resolve(Modules.NOTIFICATION) as unknown as {
    createNotifications: (input: {
      to: string
      channel: "email"
      template: string
      data: {
        title: string
        description: string
      }
    }) => Promise<void>
  }

  await notificationService.createNotifications({
    to: input.to,
    channel: "email",
    template: "customer-auth",
    data: {
      title: input.subject,
      description: buildCustomerAuthEmailHtml(input),
    },
  })
}

export async function sendCustomerEmailVerificationEmail(
  scope: MedusaContainer,
  input: {
    to: string
    verificationUrl: string
  }
): Promise<void> {
  await sendCustomerAuthEmail(scope, {
    to: input.to,
    subject: "請完成 Mr. Polar Email 驗證",
    heading: "完成 Email 驗證",
    intro:
      "歡迎加入 Mr. Polar。請在 1 小時內點擊下方按鈕完成 Email 驗證，驗證完成後即可使用 Email 與密碼登入會員帳號。",
    ctaLabel: "立即驗證 Email",
    ctaUrl: input.verificationUrl,
    supportText:
      "如果這不是你本人操作，請直接忽略這封信。若需要協助，請來信 info@mrpolar.com.tw。",
  })
}

export async function sendCustomerPasswordResetEmail(
  scope: MedusaContainer,
  input: {
    to: string
    resetUrl: string
  }
): Promise<void> {
  await sendCustomerAuthEmail(scope, {
    to: input.to,
    subject: "Mr. Polar 重設密碼通知",
    heading: "請在 15 分鐘內重設密碼",
    intro:
      "我們收到你的重設密碼申請。請在 15 分鐘內點擊下方按鈕設定新密碼；若這不是你本人操作，請直接忽略這封信。",
    ctaLabel: "前往重設密碼",
    ctaUrl: input.resetUrl,
    supportText:
      "如有任何問題，歡迎聯繫 info@mrpolar.com.tw，我們會盡快協助你。",
  })
}
