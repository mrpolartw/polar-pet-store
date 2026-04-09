import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Trophy } from "@medusajs/icons"
import { Button, Heading, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { MemberLevelFormDrawer } from "../../../components/membership/member-level-form-drawer"
import {
  PaginationControls,
  SectionCard,
  StatePanel,
} from "../../../components/membership/ui"
import {
  createMembershipMemberLevel,
  deleteMembershipMemberLevel,
  listMembershipMemberLevels,
  updateMembershipMemberLevel,
} from "../../../lib/membership/api"
import type {
  MemberLevelPayload,
  MemberLevelUpdatePayload,
  MembershipLevel,
  MembershipMemberLevelsResponse,
} from "../../../lib/membership/types"
import { formatNumber } from "../../../lib/membership/utils"

const DEFAULT_LIMIT = 20

export const config = defineRouteConfig({
  label: "會員等級",
  icon: Trophy,
  nested: "/customers",
  rank: 60,
})

function formatBoolean(value: boolean): string {
  return value ? "是" : "否"
}

function formatActiveStatus(value: boolean): string {
  return value ? "啟用中" : "已停用"
}

function formatRate(value: number): string {
  return `${formatNumber(value, {
    maximumFractionDigits: 2,
  })} 倍`
}

function formatPoints(value: number): string {
  return `${formatNumber(value)} 點`
}

export default function MembershipMemberLevelsPage() {
  const [response, setResponse] = useState<MembershipMemberLevelsResponse | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [createLoading, setCreateLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const nextResponse = await listMembershipMemberLevels({
          limit: DEFAULT_LIMIT,
          offset,
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
          loadError instanceof Error ? loadError.message : "載入會員等級失敗"
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
  }, [offset, reloadKey])

  async function handleCreate(payload: MemberLevelPayload) {
    setCreateLoading(true)

    try {
      await createMembershipMemberLevel(payload)
      toast.success("會員等級已建立")
      setOffset(0)
      setReloadKey((current) => current + 1)
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleUpdate(
    memberLevelId: string,
    payload: MemberLevelPayload
  ) {
    setEditingId(memberLevelId)

    try {
      await updateMembershipMemberLevel(memberLevelId, payload)
      toast.success("會員等級已更新")
      setReloadKey((current) => current + 1)
    } finally {
      setEditingId(null)
    }
  }

  async function handleToggleStatus(memberLevel: MembershipLevel) {
    const nextIsActive = !memberLevel.is_active
    const payload: MemberLevelUpdatePayload = {
      is_active: nextIsActive,
    }

    setTogglingId(memberLevel.id)

    try {
      await updateMembershipMemberLevel(memberLevel.id, payload)
      toast.success(nextIsActive ? "會員等級已啟用" : "會員等級已停用")
      setReloadKey((current) => current + 1)
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "更新會員等級狀態失敗"
      )
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(memberLevel: MembershipLevel) {
    if (memberLevel.member_count > 0) {
      toast.error(
        `目前仍有 ${formatNumber(memberLevel.member_count)} 位會員使用「${memberLevel.name}」，請先移轉會員後再刪除。`
      )
      return
    }

    if (!window.confirm(`確定要刪除會員等級「${memberLevel.name}」嗎？`)) {
      return
    }

    setDeletingId(memberLevel.id)

    try {
      await deleteMembershipMemberLevel(memberLevel.id)
      toast.success("會員等級已刪除")

      if (response?.member_levels.length === 1 && offset > 0) {
        setOffset((current) => Math.max(0, current - DEFAULT_LIMIT))
      } else {
        setReloadKey((current) => current + 1)
      }
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "刪除會員等級失敗"
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="space-y-1">
        <Heading level="h1">會員等級</Heading>
        <Text className="text-ui-fg-subtle">
          管理會員制度的等級規則、升級門檻與啟用狀態。這是保留中的獨立制度管理頁，不依賴已刪除的 membership customer 頁。
        </Text>
      </div>

      <SectionCard
        title="等級清單"
        description="建立、調整、啟用或停用會員等級，並確認每個等級目前的會員數。"
        action={
          <MemberLevelFormDrawer
            title="新增會員等級"
            description="請輸入符合目前會員制度的等級資料。"
            triggerLabel="新增等級"
            isSubmitting={createLoading}
            onSubmit={handleCreate}
          />
        }
      >
        {loading ? (
          <StatePanel
            title="載入會員等級中"
            message="正在整理會員制度的等級清單與會員數統計。"
          />
        ) : null}

        {!loading && error ? (
          <StatePanel
            title="無法載入會員等級"
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

        {!loading && !error && response && response.member_levels.length === 0 ? (
          <StatePanel
            title="尚未建立會員等級"
            message="目前沒有等級資料，可以先建立第一個會員等級。"
          />
        ) : null}

        {!loading && !error && response && response.member_levels.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>等級名稱</Table.HeaderCell>
                  <Table.HeaderCell>排序</Table.HeaderCell>
                  <Table.HeaderCell>回饋倍率</Table.HeaderCell>
                  <Table.HeaderCell>生日回饋倍率</Table.HeaderCell>
                  <Table.HeaderCell>升級贈點</Table.HeaderCell>
                  <Table.HeaderCell>升級門檻</Table.HeaderCell>
                  <Table.HeaderCell>自動升級</Table.HeaderCell>
                  <Table.HeaderCell>可參加活動</Table.HeaderCell>
                  <Table.HeaderCell>啟用狀態</Table.HeaderCell>
                  <Table.HeaderCell>目前會員數</Table.HeaderCell>
                  <Table.HeaderCell></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {response.member_levels.map((memberLevel) => {
                  const isBusy =
                    editingId === memberLevel.id ||
                    togglingId === memberLevel.id ||
                    deletingId === memberLevel.id

                  return (
                    <Table.Row key={memberLevel.id}>
                      <Table.Cell>
                        <div className="space-y-1">
                          <Text>{memberLevel.name}</Text>
                          <Text className="font-mono text-xs text-ui-fg-subtle">
                            {memberLevel.id}
                          </Text>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{formatNumber(memberLevel.sort_order)}</Table.Cell>
                      <Table.Cell>{formatRate(memberLevel.reward_rate)}</Table.Cell>
                      <Table.Cell>
                        {formatRate(memberLevel.birthday_reward_rate)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatPoints(memberLevel.upgrade_gift_points)}
                      </Table.Cell>
                      <Table.Cell>
                        {formatNumber(memberLevel.upgrade_threshold)}
                      </Table.Cell>
                      <Table.Cell>{formatBoolean(memberLevel.auto_upgrade)}</Table.Cell>
                      <Table.Cell>
                        {formatBoolean(memberLevel.can_join_event)}
                      </Table.Cell>
                      <Table.Cell>{formatActiveStatus(memberLevel.is_active)}</Table.Cell>
                      <Table.Cell>{formatNumber(memberLevel.member_count)}</Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end gap-2">
                          <MemberLevelFormDrawer
                            title={`編輯 ${memberLevel.name}`}
                            description="更新這個會員等級的規則設定。"
                            triggerLabel="編輯"
                            initialValue={memberLevel}
                            disabled={isBusy}
                            isSubmitting={editingId === memberLevel.id}
                            onSubmit={(payload) =>
                              handleUpdate(memberLevel.id, payload)
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            isLoading={togglingId === memberLevel.id}
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(memberLevel)}
                          >
                            {memberLevel.is_active ? "停用" : "啟用"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            isLoading={deletingId === memberLevel.id}
                            disabled={isBusy}
                            onClick={() => handleDelete(memberLevel)}
                          >
                            刪除
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>

            <PaginationControls
              count={response.count}
              limit={response.limit || DEFAULT_LIMIT}
              offset={response.offset || offset}
              isLoading={loading}
              onPrevious={() =>
                setOffset((current) => Math.max(0, current - DEFAULT_LIMIT))
              }
              onNext={() => setOffset((current) => current + DEFAULT_LIMIT)}
            />
          </>
        ) : null}
      </SectionCard>
    </div>
  )
}
