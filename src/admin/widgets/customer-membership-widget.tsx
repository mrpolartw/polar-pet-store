import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState, type FormEvent } from "react"
import type {
  AdminCustomerMembershipDetail,
  AdminCustomerMembershipDetailResponse,
} from "../../lib/membership/customer-membership-detail"
import type { CustomerGender } from "../../lib/membership/customer-gender"

type MembershipFormState = {
  phone: string
  birthday: string
  gender: CustomerGender
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message

    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      return maybeMessage
    }
  }

  return fallback
}

async function requestMembershipDetail(
  customerId: string,
  init?: RequestInit
): Promise<AdminCustomerMembershipDetailResponse> {
  const response = await fetch(`/admin/customers/${customerId}/membership`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json()) as unknown

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, `Request failed with status ${response.status}`)
    )
  }

  return payload as AdminCustomerMembershipDetailResponse
}

function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (_error) {
    return `${currencyCode} ${new Intl.NumberFormat("zh-TW").format(amount)}`
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function ReadonlyItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text>{value}</Text>
    </div>
  )
}

function toFormState(detail: AdminCustomerMembershipDetail): MembershipFormState {
  return {
    phone: detail.phone ?? "",
    birthday: detail.birthday ?? "",
    gender: detail.gender,
  }
}

const genderOptions: Array<{ label: string; value: CustomerGender }> = [
  { label: "男", value: "male" },
  { label: "女", value: "female" },
  { label: "未提供", value: "unknown" },
]

function CustomerMembershipWidget({
  data,
}: DetailWidgetProps<HttpTypes.AdminCustomer>) {
  const [membership, setMembership] =
    useState<AdminCustomerMembershipDetail | null>(null)
  const [form, setForm] = useState<MembershipFormState>({
    phone: data.phone ?? "",
    birthday: "",
    gender: "unknown",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadMembership() {
      setLoading(true)
      setError(null)

      try {
        const response = await requestMembershipDetail(data.id)

        if (!active) {
          return
        }

        setMembership(response.membership)
        setForm(toFormState(response.membership))
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "載入會員擴充資料失敗"
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadMembership()

    return () => {
      active = false
    }
  }, [data.id, reloadKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      const response = await requestMembershipDetail(data.id, {
        method: "PATCH",
        body: JSON.stringify({
          phone: form.phone.trim() || null,
          birthday: form.birthday || null,
          gender: form.gender,
        }),
      })

      setMembership(response.membership)
      setForm(toFormState(response.membership))
      toast.success("會員擴充資料已儲存")
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "儲存會員資料失敗"

      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="flex flex-col gap-y-4">
      <div className="space-y-1">
        <Heading>會員擴充資料</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          管理顧客的會員摘要與基本會員欄位。Email 不在此區塊開放編輯。
        </Text>
      </div>

      {loading ? (
        <Text className="text-ui-fg-subtle">載入會員擴充資料中...</Text>
      ) : null}

      {!loading && error ? (
        <div className="space-y-3">
          <Text className="text-ui-fg-subtle">{error}</Text>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            重新載入
          </Button>
        </div>
      ) : null}

      {!loading && !error && membership ? (
        <form className="flex flex-col gap-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <ReadonlyItem
              label="點數"
              value={new Intl.NumberFormat("zh-TW").format(
                membership.summary.points
              )}
            />
            <ReadonlyItem
              label="累計消費"
              value={formatCurrency(
                membership.summary.total_spent,
                membership.summary.currency_code
              )}
            />
            <ReadonlyItem
              label="加入日期"
              value={formatDate(membership.summary.joined_at)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-phone">手機</Label>
            <Input
              id="membership-phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="請輸入手機號碼"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-gender">性別</Label>
            <Select
              value={form.gender}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  gender: value as CustomerGender,
                }))
              }
              disabled={saving}
            >
              <Select.Trigger id="membership-gender">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {genderOptions.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-birthday">生日</Label>
            <Input
              id="membership-birthday"
              type="date"
              value={form.birthday}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  birthday: event.target.value,
                }))
              }
              disabled={saving}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={saving} disabled={saving}>
              儲存
            </Button>
          </div>
        </form>
      ) : null}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.side.after",
})

export default CustomerMembershipWidget
