import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/types"
import { Badge, Button, Container, Table, Text, toast } from "@medusajs/ui"
import { startTransition, useEffect, useState } from "react"
import { AdjustPointsDrawer } from "../components/membership/adjust-points-drawer"
import { AssignLevelDrawer } from "../components/membership/assign-level-drawer"
import {
  PaginationControls,
  SectionCard,
  StatePanel,
} from "../components/membership/ui"
import {
  adjustMembershipPoints,
  assignMembershipLevel,
  getMembershipCustomer,
  getMembershipCustomerPoints,
  listMembershipCustomerAuditLogs,
  listMembershipCustomerFavorites,
  listMembershipCustomerPets,
  listMembershipMemberLevels,
  recalculateMembershipCustomerLevel,
} from "../lib/membership/api"
import { dispatchCustomerMembershipUpdated } from "../lib/membership/events"
import type {
  MembershipCustomerAuditLogsResponse,
  MembershipCustomerFavoritesResponse,
  MembershipCustomerPetsResponse,
  MembershipCustomerPointsResponse,
  MembershipCustomerResponse,
  MembershipLevelSummary,
} from "../lib/membership/types"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  stringifyJson,
} from "../lib/membership/utils"

const POINTS_LIMIT = 5
const AUDIT_LOG_LIMIT = 5
const MEMBER_LEVEL_LIMIT = 100

function formatPointSource(source: string): string {
  const labels: Record<string, string> = {
    order: "訂單回饋",
    birthday_bonus: "生日加碼",
    refund: "退款扣回",
    admin: "後台調整",
    expire: "點數到期",
    redeem: "點數折抵",
    bonus: "額外贈點",
    upgrade_gift: "升等贈點",
  }

  return labels[source] ?? source
}

function formatPetSpecies(species: string | null): string {
  const labels: Record<string, string> = {
    dog: "狗",
    cat: "貓",
    bird: "鳥",
    other: "其他",
  }

  return species ? labels[species] ?? species : "-"
}

function formatPetGender(gender: string): string {
  const labels: Record<string, string> = {
    male: "公",
    female: "母",
    unknown: "未提供",
  }

  return labels[gender] ?? gender
}

function formatSubscriptionStatus(status: string): string {
  const labels: Record<string, string> = {
    active: "啟用中",
    paused: "已暫停",
    canceled: "已取消",
    expired: "已到期",
  }

  return labels[status] ?? status
}

function formatAddressType(type: "home" | "711"): string {
  return type === "711" ? "7-11 門市" : "宅配地址"
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <Text className="text-ui-fg-muted">{label}</Text>
      <Text>{value}</Text>
    </div>
  )
}

function AddressDescription({
  city,
  district,
  address,
  storeName,
  storeId,
}: {
  city: string
  district: string
  address: string
  storeName: string
  storeId: string
}) {
  if (storeName || storeId) {
    return (
      <div className="space-y-1">
        <Text>{storeName || "-"}</Text>
        <Text className="text-ui-fg-subtle">{storeId || "-"}</Text>
      </div>
    )
  }

  return <Text>{[city, district, address].filter(Boolean).join("") || "-"}</Text>
}

function CustomerMembershipManagementWidget({
  data,
}: DetailWidgetProps<HttpTypes.AdminCustomer>) {
  const [detail, setDetail] = useState<MembershipCustomerResponse | null>(null)
  const [points, setPoints] =
    useState<MembershipCustomerPointsResponse | null>(null)
  const [pets, setPets] = useState<MembershipCustomerPetsResponse | null>(null)
  const [favorites, setFavorites] =
    useState<MembershipCustomerFavoritesResponse | null>(null)
  const [auditLogs, setAuditLogs] =
    useState<MembershipCustomerAuditLogsResponse | null>(null)
  const [memberLevels, setMemberLevels] = useState<MembershipLevelSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pointsOffset, setPointsOffset] = useState(0)
  const [auditOffset, setAuditOffset] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [adjustingPoints, setAdjustingPoints] = useState(false)
  const [assigningLevel, setAssigningLevel] = useState(false)
  const [recalculatingLevel, setRecalculatingLevel] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [
          nextDetail,
          nextPoints,
          nextPets,
          nextFavorites,
          nextAuditLogs,
          nextMemberLevels,
        ] = await Promise.all([
          getMembershipCustomer(data.id),
          getMembershipCustomerPoints(data.id, {
            limit: POINTS_LIMIT,
            offset: pointsOffset,
          }),
          listMembershipCustomerPets(data.id),
          listMembershipCustomerFavorites(data.id),
          listMembershipCustomerAuditLogs(data.id, {
            limit: AUDIT_LOG_LIMIT,
            offset: auditOffset,
          }),
          listMembershipMemberLevels({
            limit: MEMBER_LEVEL_LIMIT,
            is_active: true,
          }),
        ])

        if (!active) {
          return
        }

        setDetail(nextDetail)
        setPoints(nextPoints)
        setPets(nextPets)
        setFavorites(nextFavorites)
        setAuditLogs(nextAuditLogs)
        setMemberLevels(nextMemberLevels.member_levels)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "讀取會員管理資料時發生錯誤。"
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
  }, [auditOffset, data.id, pointsOffset, reloadKey])

  async function handleAdjustPoints(payload: {
    delta: number
    note?: string | null
    expired_at?: string | null
  }) {
    setAdjustingPoints(true)

    try {
      await adjustMembershipPoints(data.id, {
        delta: payload.delta,
        note: payload.note ?? null,
        expired_at: payload.expired_at ?? null,
        source: "admin",
      })
      toast.success("點數已成功調整。")
      dispatchCustomerMembershipUpdated(data.id)
      startTransition(() => {
        setPointsOffset(0)
        setAuditOffset(0)
        setReloadKey((current) => current + 1)
      })
    } finally {
      setAdjustingPoints(false)
    }
  }

  async function handleAssignLevel(memberLevelId: string) {
    setAssigningLevel(true)

    try {
      const response = await assignMembershipLevel(data.id, {
        member_level_id: memberLevelId,
      })
      toast.success(
        `會員等級已更新為 ${response.member_level?.name ?? "未設定"}。`
      )
      dispatchCustomerMembershipUpdated(data.id)
      startTransition(() => {
        setAuditOffset(0)
        setReloadKey((current) => current + 1)
      })
    } finally {
      setAssigningLevel(false)
    }
  }

  async function handleRecalculateLevel() {
    setRecalculatingLevel(true)

    try {
      const response = await recalculateMembershipCustomerLevel(data.id)
      const levelName = response.current_level?.name ?? "未設定"

      toast.success(
        response.changed
          ? `會員等級已重新計算，最新等級為 ${levelName}。`
          : `會員等級重算完成，目前維持 ${levelName}。`
      )
      dispatchCustomerMembershipUpdated(data.id)
      startTransition(() => {
        setAuditOffset(0)
        setReloadKey((current) => current + 1)
      })
    } catch (recalculateError) {
      toast.error(
        recalculateError instanceof Error
          ? recalculateError.message
          : "會員等級重算失敗。"
      )
    } finally {
      setRecalculatingLevel(false)
    }
  }

  if (loading) {
    return (
      <StatePanel
        title="載入會員管理資料中"
        message="系統正在整理點數、地址、收藏、毛孩與稽核紀錄。"
      />
    )
  }

  if (error) {
    return (
      <StatePanel
        title="無法讀取會員管理資料"
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
    )
  }

  if (!detail) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-6">
      <SectionCard
        title="會員管理"
        description="集中查看會員等級、點數、地址、毛孩、收藏與稽核資訊。"
        action={
          <div className="flex flex-wrap gap-2">
            <AssignLevelDrawer
              levels={memberLevels}
              currentLevelId={detail.current_level?.id ?? null}
              isSubmitting={assigningLevel}
              onSubmit={handleAssignLevel}
            />
            <AdjustPointsDrawer
              isSubmitting={adjustingPoints}
              onSubmit={handleAdjustPoints}
            />
            <Button
              type="button"
              variant="secondary"
              isLoading={recalculatingLevel}
              disabled={recalculatingLevel}
              onClick={handleRecalculateLevel}
            >
              重新計算等級
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryItem
            label="目前會員等級"
            value={detail.current_level?.name ?? "-"}
          />
          <SummaryItem
            label="可用點數"
            value={formatNumber(detail.points_summary.available_points)}
          />
          <SummaryItem label="地址數量" value={String(detail.addresses_count)} />
          <SummaryItem label="收藏數量" value={String(detail.favorites_count)} />
          <SummaryItem label="毛孩數量" value={String(detail.pets_count)} />
        </div>
      </SectionCard>

      <SectionCard
        title="訂閱摘要"
        description="顯示此會員最近的啟用中訂閱資訊。"
      >
        {detail.active_subscription ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryItem
              label="方案名稱"
              value={detail.active_subscription.plan_name}
            />
            <SummaryItem
              label="狀態"
              value={formatSubscriptionStatus(detail.active_subscription.status)}
            />
            <SummaryItem
              label="金額"
              value={formatCurrency(
                detail.active_subscription.amount,
                detail.active_subscription.currency_code
              )}
            />
            <SummaryItem
              label="開始日期"
              value={formatDateTime(detail.active_subscription.started_at)}
            />
            <SummaryItem
              label="到期日"
              value={formatDateTime(detail.active_subscription.expires_at)}
            />
            <SummaryItem
              label="下次扣款日"
              value={formatDateTime(detail.active_subscription.next_billing_at)}
            />
          </div>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有啟用中的訂閱。</Text>
        )}
      </SectionCard>

      <SectionCard
        title="地址資料"
        description="欄位與前台地址簿一致，使用同一份會員地址資料來源。"
      >
        {detail.addresses.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>類型</Table.HeaderCell>
                <Table.HeaderCell>標籤</Table.HeaderCell>
                <Table.HeaderCell>收件人</Table.HeaderCell>
                <Table.HeaderCell>手機</Table.HeaderCell>
                <Table.HeaderCell>地址內容</Table.HeaderCell>
                <Table.HeaderCell>預設</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {detail.addresses.map((address) => (
                <Table.Row key={address.id}>
                  <Table.Cell>{formatAddressType(address.type)}</Table.Cell>
                  <Table.Cell>{address.label || "-"}</Table.Cell>
                  <Table.Cell>{address.name || "-"}</Table.Cell>
                  <Table.Cell>{address.phone || "-"}</Table.Cell>
                  <Table.Cell>
                    <AddressDescription
                      city={address.city}
                      district={address.district}
                      address={address.address}
                      storeName={address.store_name}
                      storeId={address.store_id}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {address.is_default ? (
                      <Badge color="green">預設</Badge>
                    ) : (
                      <Text className="text-ui-fg-subtle">-</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有會員地址資料。</Text>
        )}
      </SectionCard>

      <SectionCard
        title="點數紀錄"
        description="可查看點數來源、餘額與這筆異動的實際執行者。"
      >
        {points && points.logs.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>建立時間</Table.HeaderCell>
                  <Table.HeaderCell>來源</Table.HeaderCell>
                  <Table.HeaderCell>異動者</Table.HeaderCell>
                  <Table.HeaderCell>點數異動</Table.HeaderCell>
                  <Table.HeaderCell>異動後餘額</Table.HeaderCell>
                  <Table.HeaderCell>備註</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {points.logs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell>{formatDateTime(log.created_at)}</Table.Cell>
                    <Table.Cell>{formatPointSource(log.source)}</Table.Cell>
                    <Table.Cell>{log.actor.actor_label}</Table.Cell>
                    <Table.Cell>{formatNumber(log.points)}</Table.Cell>
                    <Table.Cell>{formatNumber(log.balance_after)}</Table.Cell>
                    <Table.Cell>{log.note ?? "-"}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <PaginationControls
              count={points.count}
              limit={points.limit || POINTS_LIMIT}
              offset={points.offset || pointsOffset}
              onPrevious={() =>
                setPointsOffset((current) => Math.max(0, current - POINTS_LIMIT))
              }
              onNext={() => setPointsOffset((current) => current + POINTS_LIMIT)}
            />
          </>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有點數異動紀錄。</Text>
        )}
      </SectionCard>

      <SectionCard title="毛孩資料">
        {pets && pets.pets.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>名稱</Table.HeaderCell>
                <Table.HeaderCell>物種</Table.HeaderCell>
                <Table.HeaderCell>性別</Table.HeaderCell>
                <Table.HeaderCell>品種</Table.HeaderCell>
                <Table.HeaderCell>生日</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pets.pets.map((pet) => (
                <Table.Row key={pet.id}>
                  <Table.Cell>{pet.name}</Table.Cell>
                  <Table.Cell>{formatPetSpecies(pet.species)}</Table.Cell>
                  <Table.Cell>{formatPetGender(pet.gender)}</Table.Cell>
                  <Table.Cell>{pet.breed ?? "-"}</Table.Cell>
                  <Table.Cell>{formatDate(pet.birthday)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有毛孩資料。</Text>
        )}
      </SectionCard>

      <SectionCard title="收藏摘要">
        {favorites && favorites.favorites.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>收藏 ID</Table.HeaderCell>
                <Table.HeaderCell>商品 ID</Table.HeaderCell>
                <Table.HeaderCell>規格 ID</Table.HeaderCell>
                <Table.HeaderCell>收藏時間</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {favorites.favorites.map((favorite) => (
                <Table.Row key={favorite.id}>
                  <Table.Cell className="font-mono text-xs">
                    {favorite.id}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs">
                    {favorite.product_id}
                  </Table.Cell>
                  <Table.Cell className="font-mono text-xs">
                    {favorite.variant_id ?? "-"}
                  </Table.Cell>
                  <Table.Cell>{formatDateTime(favorite.created_at)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有收藏商品紀錄。</Text>
        )}
      </SectionCard>

      <SectionCard title="稽核紀錄">
        {auditLogs && auditLogs.audit_logs.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>建立時間</Table.HeaderCell>
                  <Table.HeaderCell>動作</Table.HeaderCell>
                  <Table.HeaderCell>執行者</Table.HeaderCell>
                  <Table.HeaderCell>變更前</Table.HeaderCell>
                  <Table.HeaderCell>變更後</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {auditLogs.audit_logs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell>{formatDateTime(log.created_at)}</Table.Cell>
                    <Table.Cell>{log.action}</Table.Cell>
                    <Table.Cell>{`${log.actor_type}:${log.actor_id}`}</Table.Cell>
                    <Table.Cell>
                      <Container className="max-w-[260px] overflow-auto">
                        <pre className="whitespace-pre-wrap text-xs">
                          {stringifyJson(log.before_state)}
                        </pre>
                      </Container>
                    </Table.Cell>
                    <Table.Cell>
                      <Container className="max-w-[260px] overflow-auto">
                        <pre className="whitespace-pre-wrap text-xs">
                          {stringifyJson(log.after_state)}
                        </pre>
                      </Container>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <PaginationControls
              count={auditLogs.count}
              limit={auditLogs.limit || AUDIT_LOG_LIMIT}
              offset={auditLogs.offset || auditOffset}
              onPrevious={() =>
                setAuditOffset((current) =>
                  Math.max(0, current - AUDIT_LOG_LIMIT)
                )
              }
              onNext={() => setAuditOffset((current) => current + AUDIT_LOG_LIMIT)}
            />
          </>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有稽核紀錄。</Text>
        )}
      </SectionCard>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
})

export default CustomerMembershipManagementWidget
