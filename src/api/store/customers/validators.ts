import { z } from "@medusajs/framework/zod"

const storeAddressTypeSchema = z.enum(["home", "711"])

const storeCustomerAddressBase = z.object({
  type: storeAddressTypeSchema,
  label: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1, "請輸入收件人姓名"),
  phone: z.string().trim().min(1, "請輸入手機號碼"),
  city: z.string().trim().max(50).nullish(),
  district: z.string().trim().max(50).nullish(),
  address: z.string().trim().max(255).nullish(),
  is_default: z.boolean().optional(),
  store_name: z.string().trim().max(100).nullish(),
  store_id: z.string().trim().max(50).nullish(),
})

export const StoreCreateCustomerAddress = storeCustomerAddressBase.superRefine((data, ctx) => {
  if (data.type === "home") {
    if (!data.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "請選擇縣市",
      })
    }

    if (!data.district) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["district"],
        message: "請輸入鄉鎮市區",
      })
    }

    if (!data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "請輸入詳細地址",
      })
    }
  }

  if (data.type === "711" && !data.store_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["store_name"],
      message: "請先選擇 7-11 門市",
    })
  }
})

export const StoreUpdateCustomerAddress = storeCustomerAddressBase.partial()
  .extend({
    type: storeAddressTypeSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "請至少提供一個要更新的欄位",
  })

export type StoreCreateCustomerAddressType = z.infer<
  typeof StoreCreateCustomerAddress
>
export type StoreUpdateCustomerAddressType = z.infer<
  typeof StoreUpdateCustomerAddress
>
