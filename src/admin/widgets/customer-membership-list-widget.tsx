import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { SectionCard, StatePanel } from "../components/membership/ui"
import { listMembershipCustomers } from "../lib/membership/api"
import type {
  MembershipCustomer,
  MembershipCustomersResponse,
} from "../lib/membership/types"
import {
  formatDateTime,
  getCustomerDisplayName,
} from "../lib/membership/utils"

const DEFAULT_PAGE_SIZE = 20

function formatLineBindingStatus(
  status: MembershipCustomer["line_binding_status"]
) {
  if (status === "bound") {
    return "已綁定"
  }

  if (status === "unbound") {
    return "未綁定"
  }

  return "-"
}

function CustomerMembershipListWidget() {
  const [searchParams] = useSearchParams()
  const [response, setResponse] = useState<MembershipCustomersResponse | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const q = searchParams.get("q") ?? ""
  const offset = Number(searchParams.get("offset") ?? 0) || 0
  const limit =
    Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE
  const order = searchParams.get("order") ?? undefined
  const hasAccountParam = searchParams.get("has_account")
  const groups = searchParams.get("groups") ?? undefined

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const nextResponse = await listMembershipCustomers({
          q: q || undefined,
          limit,
          offset,
          order,
          has_account:
            hasAccountParam === null ? undefined : hasAccountParam === "true",
          groups,
        })

        if (!active) {
          return
        }

        setResponse(nextResponse)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "載入會員欄位總覽時發生錯誤"
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [groups, hasAccountParam, limit, offset, order, q, reloadKey])

  return (
    <SectionCard
      title="會員欄位總覽"
      description="延伸既有 customers list，沿用原本查詢條件與分頁，只補充會員相關欄位。"
    >
      {loading ? (
        <StatePanel
          title="載入會員欄位總覽中"
          message="正在同步 customers 列表的搜尋條件與會員資料。"
        />
      ) : null}

      {!loading && error ? (
        <StatePanel
          title="無法載入會員欄位總覽"
          message={error}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              重新載入
            </Button>
          }
        />
      ) : null}

      {!loading && !error && response && response.customers.length === 0 ? (
        <Text className="text-ui-fg-subtle">目前沒有符合條件的顧客。</Text>
      ) : null}

      {!loading && !error && response && response.customers.length > 0 ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>顧客</Table.HeaderCell>
              <Table.HeaderCell>會員等級</Table.HeaderCell>
              <Table.HeaderCell>加入日期</Table.HeaderCell>
              <Table.HeaderCell>最後登入日期</Table.HeaderCell>
              <Table.HeaderCell>最後訂購日期</Table.HeaderCell>
              <Table.HeaderCell>LINE 綁定狀態</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {response.customers.map((customer) => (
              <Table.Row key={customer.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <Link
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                      to={`/customers/${customer.id}`}
                    >
                      {getCustomerDisplayName(customer)}
                    </Link>
                    <Text size="small" className="text-ui-fg-subtle">
                      {customer.email ?? customer.phone ?? customer.id}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>{customer.membership_member_level?.name ?? "-"}</Table.Cell>
                <Table.Cell>{formatDateTime(customer.joined_at)}</Table.Cell>
                <Table.Cell>{formatDateTime(customer.last_login_at)}</Table.Cell>
                <Table.Cell>{formatDateTime(customer.last_ordered_at)}</Table.Cell>
                <Table.Cell>
                  {formatLineBindingStatus(customer.line_binding_status)}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : null}
    </SectionCard>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.list.after",
})

export default CustomerMembershipListWidget
