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
  label: "Member Levels",
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
            : "Failed to load member levels"
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
      toast.success("Member level created")
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
      toast.success("Member level updated")
      setReloadKey((current) => current + 1)
    } finally {
      setEditingId(null)
    }
  }

  async function handleDelete(memberLevel: MembershipLevel) {
    if (!window.confirm(`Delete member level "${memberLevel.name}"?`)) {
      return
    }

    setDeletingId(memberLevel.id)

    try {
      await deleteMembershipMemberLevel(memberLevel.id)
      toast.success("Member level deleted")
      setReloadKey((current) => current + 1)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete member level"
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="space-y-1">
        <Heading level="h1">Member levels</Heading>
        <Text className="text-ui-fg-subtle">
          Create, edit, and remove membership levels used by the membership
          module.
        </Text>
      </div>

      <SectionCard
        title="Levels"
        description="Manage rank, points threshold, discount rate, and availability."
        action={
          <MemberLevelFormDrawer
            title="Create member level"
            description="Add a new membership level."
            triggerLabel="Create level"
            isSubmitting={createLoading}
            onSubmit={handleCreate}
          />
        }
      >
        {loading ? (
          <StatePanel
            title="Loading member levels"
            message="Fetching membership level records..."
          />
        ) : null}

        {!loading && error ? (
          <StatePanel
            title="Could not load member levels"
            message={error}
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Retry
              </Button>
            }
          />
        ) : null}

        {!loading && !error && response && response.member_levels.length === 0 ? (
          <StatePanel
            title="No member levels"
            message="Create the first membership level to start assigning customers."
          />
        ) : null}

        {!loading && !error && response && response.member_levels.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>ID</Table.HeaderCell>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Rank</Table.HeaderCell>
                  <Table.HeaderCell>Min points</Table.HeaderCell>
                  <Table.HeaderCell>Discount</Table.HeaderCell>
                  <Table.HeaderCell>Active</Table.HeaderCell>
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
                    <Table.Cell>{String(memberLevel.rank)}</Table.Cell>
                    <Table.Cell>{String(memberLevel.min_points)}</Table.Cell>
                    <Table.Cell>{String(memberLevel.discount_rate)}</Table.Cell>
                    <Table.Cell>{memberLevel.is_active ? "Yes" : "No"}</Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end gap-2">
                        <MemberLevelFormDrawer
                          title={`Edit ${memberLevel.name}`}
                          description="Update this membership level."
                          triggerLabel="Edit"
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
                          Delete
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
