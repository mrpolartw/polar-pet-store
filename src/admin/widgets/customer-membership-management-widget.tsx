import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/types"
import { Button, Container, Table, Text, toast } from "@medusajs/ui"
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
  formatDateTime,
  stringifyJson,
} from "../lib/membership/utils"

const POINTS_LIMIT = 5
const AUDIT_LOG_LIMIT = 5

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

function formatPointSource(source: string): string {
  const pointSourceLabelMap: Record<string, string> = {
    order: "訂單",
    refund: "退款",
    admin: "後台",
    expire: "到期",
    redeem: "折抵",
    bonus: "贈點",
  }

  return pointSourceLabelMap[source] ?? source
}

function formatPetSpecies(species: string | null): string {
  const petSpeciesLabelMap: Record<string, string> = {
    dog: "狗",
    cat: "貓",
    bird: "鳥",
    other: "其他",
  }

  return species ? petSpeciesLabelMap[species] ?? species : "-"
}

function formatPetGender(gender: string): string {
  const petGenderLabelMap: Record<string, string> = {
    male: "公",
    female: "母",
    unknown: "未知",
  }

  return petGenderLabelMap[gender] ?? gender
}

function formatSubscriptionStatus(status: string): string {
  const subscriptionStatusLabelMap: Record<string, string> = {
    active: "啟用中",
    paused: "已暫停",
    canceled: "已取消",
    expired: "已到期",
  }

  return subscriptionStatusLabelMap[status] ?? status
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
  const [levels, setLevels] = useState<MembershipLevelSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pointsOffset, setPointsOffset] = useState(0)
  const [auditOffset, setAuditOffset] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [adjustingPoints, setAdjustingPoints] = useState(false)
  const [assigningLevel, setAssigningLevel] = useState(false)

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
          nextLevels,
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
            limit: 100,
            offset: 0,
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
        setLevels(nextLevels.member_levels)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "載入進階會員管理資料時發生錯誤"
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
  }) {
    setAdjustingPoints(true)

    try {
      await adjustMembershipPoints(data.id, {
        delta: payload.delta,
        note: payload.note ?? null,
        source: "admin",
      })
      toast.success("點數已更新")
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
      await assignMembershipLevel(data.id, {
        member_level_id: memberLevelId,
      })
      toast.success("會員等級已更新")
      dispatchCustomerMembershipUpdated(data.id)
      startTransition(() => {
        setAuditOffset(0)
        setReloadKey((current) => current + 1)
      })
    } finally {
      setAssigningLevel(false)
    }
  }

  if (loading) {
    return (
      <StatePanel
        title="載入進階會員管理資料中"
        message="正在整理會員等級、點數、稽核紀錄與附屬會員資料。"
      />
    )
  }

  if (error) {
    return (
      <StatePanel
        title="無法載入進階會員管理資料"
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
        title="進階會員管理"
        description="集中管理會員等級、點數與相關稽核紀錄，並查看收藏商品、毛孩資料與活躍訂閱。"
        action={
          <div className="flex flex-wrap gap-2">
            <AdjustPointsDrawer
              isSubmitting={adjustingPoints}
              onSubmit={handleAdjustPoints}
            />
            <AssignLevelDrawer
              levels={levels}
              currentLevelId={detail.current_level?.id ?? null}
              isSubmitting={assigningLevel}
              onSubmit={handleAssignLevel}
            />
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryItem
            label="目前會員等級"
            value={detail.current_level?.name ?? "-"}
          />
          <SummaryItem label="收藏商品數" value={String(detail.favorites_count)} />
          <SummaryItem label="毛孩數量" value={String(detail.pets_count)} />
        </div>
      </SectionCard>

      <SectionCard title="活躍訂閱">
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
              label="開始時間"
              value={formatDateTime(detail.active_subscription.started_at)}
            />
            <SummaryItem
              label="到期時間"
              value={formatDateTime(detail.active_subscription.expires_at)}
            />
            <SummaryItem
              label="下次扣款時間"
              value={formatDateTime(detail.active_subscription.next_billing_at)}
            />
          </div>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有活躍訂閱。</Text>
        )}
      </SectionCard>

      <SectionCard title="點數紀錄" description="顯示點數異動歷程與餘額變化。">
        {points && points.logs.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>建立時間</Table.HeaderCell>
                  <Table.HeaderCell>來源</Table.HeaderCell>
                  <Table.HeaderCell>異動</Table.HeaderCell>
                  <Table.HeaderCell>餘額</Table.HeaderCell>
                  <Table.HeaderCell>備註</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {points.logs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell>{formatDateTime(log.created_at)}</Table.Cell>
                    <Table.Cell>{formatPointSource(log.source)}</Table.Cell>
                    <Table.Cell>{String(log.points)}</Table.Cell>
                    <Table.Cell>{String(log.balance_after)}</Table.Cell>
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
                  <Table.Cell>{formatDateTime(pet.birthday)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Text className="text-ui-fg-subtle">目前沒有毛孩資料。</Text>
        )}
      </SectionCard>

      <SectionCard title="收藏商品">
        {favorites && favorites.favorites.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>收藏 ID</Table.HeaderCell>
                <Table.HeaderCell>商品 ID</Table.HeaderCell>
                <Table.HeaderCell>變體 ID</Table.HeaderCell>
                <Table.HeaderCell>建立時間</Table.HeaderCell>
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
          <Text className="text-ui-fg-subtle">目前沒有收藏商品資料。</Text>
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
