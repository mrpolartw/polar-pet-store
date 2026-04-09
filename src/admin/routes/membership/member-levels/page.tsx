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

const DEFAULT_LIMIT = 20

export const config = defineRouteConfig({
  label: "會員等級",
  icon: Trophy,
  nested: "/customers",
  rank: 60,
})

export default function MembershipMemberLevelsPage() {
  const [response, setResponse] = useState<MembershipMemberLevelsResponse | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [createLoading, setCreateLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
          loadError instanceof Error
            ? loadError.message
            : "載入會員等級失敗"
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
    payload: MemberLevelUpdatePayload
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

  async function handleDelete(memberLevel: MembershipLevel) {
    if (!window.confirm(`確定要刪除會員等級「${memberLevel.name}」嗎？`)) {
      return
    }

    setDeletingId(memberLevel.id)

    try {
      await deleteMembershipMemberLevel(memberLevel.id)
      toast.success("會員等級已刪除")
      setReloadKey((current) => current + 1)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "刪除會員等級失敗"
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
          依照已定版規格維護會員等級的排序、回饋倍率、升級條件與啟用狀態。
        </Text>
      </div>

      <SectionCard
        title="等級列表"
        description="在既有管理頁內直接建立、編輯與刪除會員等級。"
        action={
          <MemberLevelFormDrawer
            title="建立會員等級"
            description="新增一筆會員等級設定。"
            triggerLabel="新增等級"
            isSubmitting={createLoading}
            onSubmit={handleCreate}
          />
        }
      >
        {loading ? (
          <StatePanel
            title="載入會員等級中"
            message="正在讀取會員等級資料..."
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
            title="尚無會員等級"
            message="建立第一筆會員等級後，就可以開始指派顧客。"
          />
        ) : null}

        {!loading && !error && response && response.member_levels.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>ID</Table.HeaderCell>
                  <Table.HeaderCell>名稱</Table.HeaderCell>
                  <Table.HeaderCell>排序</Table.HeaderCell>
                  <Table.HeaderCell>回饋倍率</Table.HeaderCell>
                  <Table.HeaderCell>生日倍率</Table.HeaderCell>
                  <Table.HeaderCell>升級贈點</Table.HeaderCell>
                  <Table.HeaderCell>升級門檻</Table.HeaderCell>
                  <Table.HeaderCell>自動升級</Table.HeaderCell>
                  <Table.HeaderCell>可參與活動</Table.HeaderCell>
                  <Table.HeaderCell>啟用</Table.HeaderCell>
                  <Table.HeaderCell></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {response.member_levels.map((memberLevel) => (
                  <Table.Row key={memberLevel.id}>
                    <Table.Cell className="font-mono text-xs">
                      {memberLevel.id}
                    </Table.Cell>
                    <Table.Cell>{memberLevel.name}</Table.Cell>
                    <Table.Cell>{String(memberLevel.sort_order)}</Table.Cell>
                    <Table.Cell>{String(memberLevel.reward_rate)}</Table.Cell>
                    <Table.Cell>
                      {String(memberLevel.birthday_reward_rate)}
                    </Table.Cell>
                    <Table.Cell>
                      {String(memberLevel.upgrade_gift_points)}
                    </Table.Cell>
                    <Table.Cell>
                      {String(memberLevel.upgrade_threshold)}
                    </Table.Cell>
                    <Table.Cell>
                      {memberLevel.auto_upgrade ? "是" : "否"}
                    </Table.Cell>
                    <Table.Cell>
                      {memberLevel.can_join_event ? "是" : "否"}
                    </Table.Cell>
                    <Table.Cell>{memberLevel.is_active ? "是" : "否"}</Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <MemberLevelFormDrawer
                          title={`編輯 ${memberLevel.name}`}
                          description="更新這筆會員等級設定。"
                          triggerLabel="編輯"
                          initialValue={memberLevel}
                          isSubmitting={editingId === memberLevel.id}
                          onSubmit={(payload) =>
                            handleUpdate(memberLevel.id, payload)
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          isLoading={deletingId === memberLevel.id}
                          disabled={deletingId === memberLevel.id}
                          onClick={() => handleDelete(memberLevel)}
                        >
                          刪除
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
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
