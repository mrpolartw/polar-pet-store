import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { startTransition, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AdjustPointsDrawer } from "../../../../components/membership/adjust-points-drawer"
import { AssignLevelDrawer } from "../../../../components/membership/assign-level-drawer"
import {
  PaginationControls,
  SectionCard,
  StatePanel,
} from "../../../../components/membership/ui"
import {
  adjustMembershipPoints,
  assignMembershipLevel,
  getMembershipCustomer,
  getMembershipCustomerPoints,
  getMembershipCustomerSubscription,
  listMembershipCustomerAuditLogs,
  listMembershipCustomerFavorites,
  listMembershipCustomerPets,
  listMembershipMemberLevels,
} from "../../../../lib/membership/api"
import type {
  MembershipCustomerAuditLogsResponse,
  MembershipCustomerFavoritesResponse,
  MembershipCustomerPetsResponse,
  MembershipCustomerPointsResponse,
  MembershipCustomerResponse,
  MembershipCustomerSubscriptionResponse,
  MembershipLevelSummary,
} from "../../../../lib/membership/types"
import {
  formatCurrency,
  formatDateTime,
  getCustomerDisplayName,
  stringifyJson,
} from "../../../../lib/membership/utils"

const POINTS_LIMIT = 20
const AUDIT_LOG_LIMIT = 20

export const config = defineRouteConfig({})

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

export default function MembershipCustomerDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const customerId = params.id

  const [detail, setDetail] = useState<MembershipCustomerResponse | null>(null)
  const [points, setPoints] =
    useState<MembershipCustomerPointsResponse | null>(null)
  const [pets, setPets] = useState<MembershipCustomerPetsResponse | null>(null)
  const [favorites, setFavorites] =
    useState<MembershipCustomerFavoritesResponse | null>(null)
  const [subscription, setSubscription] =
    useState<MembershipCustomerSubscriptionResponse | null>(null)
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
    if (!customerId) {
      setError("Customer id is missing")
      setLoading(false)
      return
    }

    const customerIdValue = customerId
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
          nextSubscription,
          nextAuditLogs,
          nextLevels,
        ] = await Promise.all([
          getMembershipCustomer(customerIdValue),
          getMembershipCustomerPoints(customerIdValue, {
            limit: POINTS_LIMIT,
            offset: pointsOffset,
          }),
          listMembershipCustomerPets(customerIdValue),
          listMembershipCustomerFavorites(customerIdValue),
          getMembershipCustomerSubscription(customerIdValue),
          listMembershipCustomerAuditLogs(customerIdValue, {
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
        setSubscription(nextSubscription)
        setAuditLogs(nextAuditLogs)
        setLevels(nextLevels.member_levels)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load customer membership detail"
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
  }, [auditOffset, customerId, pointsOffset, reloadKey])

  if (!customerId) {
    return (
      <StatePanel
        title="Missing customer id"
        message="The requested membership customer id is not available."
      />
    )
  }

  const resolvedCustomerId = customerId

  async function handleAdjustPoints(payload: {
    delta: number
    note?: string | null
  }) {
    setAdjustingPoints(true)

    try {
      await adjustMembershipPoints(resolvedCustomerId, {
        delta: payload.delta,
        note: payload.note ?? null,
        source: "admin",
      })
      toast.success("Points adjusted")
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
      await assignMembershipLevel(resolvedCustomerId, {
        member_level_id: memberLevelId,
      })
      toast.success("Member level updated")
      startTransition(() => {
        setAuditOffset(0)
        setReloadKey((current) => current + 1)
      })
    } finally {
      setAssigningLevel(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Heading level="h1">Membership customer detail</Heading>
          <Text className="text-ui-fg-subtle">
            Review membership data, points, linked level, pets, favorites, and
            audit logs for this customer.
          </Text>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate("/membership/customers")}
        >
          Back to list
        </Button>
      </div>

      {loading ? (
        <StatePanel
          title="Loading customer detail"
          message="Fetching membership detail, points, pets, favorites, subscription, and audit logs..."
        />
      ) : null}

      {!loading && error ? (
        <StatePanel
          title="Could not load customer detail"
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

      {!loading && !error && detail ? (
        <>
          <SectionCard title="Basic profile">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryItem label="Customer ID" value={detail.customer.id} />
              <SummaryItem
                label="Name"
                value={getCustomerDisplayName(detail.customer)}
              />
              <SummaryItem label="Email" value={detail.customer.email ?? "-"} />
              <SummaryItem label="Phone" value={detail.customer.phone ?? "-"} />
              <SummaryItem
                label="Created at"
                value={formatDateTime(detail.customer.created_at)}
              />
              <SummaryItem
                label="Has account"
                value={detail.customer.has_account ? "Yes" : "No"}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Level and points"
            description="Current linked level and current points balance."
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
                label="Current level"
                value={detail.current_level?.name ?? "-"}
              />
              <SummaryItem
                label="升級門檻"
                value={
                  detail.current_level
                    ? String(detail.current_level.upgrade_threshold)
                    : "-"
                }
              />
              <SummaryItem
                label="Points balance"
                value={String(detail.points_balance)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Point logs"
            description="The point log API currently uses route-level pagination over the returned log array."
          >
            {points && points.logs.length > 0 ? (
              <>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Created</Table.HeaderCell>
                      <Table.HeaderCell>Source</Table.HeaderCell>
                      <Table.HeaderCell>Delta</Table.HeaderCell>
                      <Table.HeaderCell>Balance</Table.HeaderCell>
                      <Table.HeaderCell>Note</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {points.logs.map((log) => (
                      <Table.Row key={log.id}>
                        <Table.Cell>{formatDateTime(log.created_at)}</Table.Cell>
                        <Table.Cell>{log.source}</Table.Cell>
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
                    setPointsOffset((current) =>
                      Math.max(0, current - POINTS_LIMIT)
                    )
                  }
                  onNext={() =>
                    setPointsOffset((current) => current + POINTS_LIMIT)
                  }
                />
              </>
            ) : (
              <Text className="text-ui-fg-subtle">No point logs yet.</Text>
            )}
          </SectionCard>

          <SectionCard title="Pets">
            {pets && pets.pets.length > 0 ? (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Species</Table.HeaderCell>
                    <Table.HeaderCell>Gender</Table.HeaderCell>
                    <Table.HeaderCell>Breed</Table.HeaderCell>
                    <Table.HeaderCell>Birthday</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {pets.pets.map((pet) => (
                    <Table.Row key={pet.id}>
                      <Table.Cell>{pet.name}</Table.Cell>
                      <Table.Cell>{pet.species ?? "-"}</Table.Cell>
                      <Table.Cell>{pet.gender}</Table.Cell>
                      <Table.Cell>{pet.breed ?? "-"}</Table.Cell>
                      <Table.Cell>{formatDateTime(pet.birthday)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            ) : (
              <Text className="text-ui-fg-subtle">
                No pets recorded for this customer.
              </Text>
            )}
          </SectionCard>

          <SectionCard title="Favorites">
            {favorites && favorites.favorites.length > 0 ? (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Favorite ID</Table.HeaderCell>
                    <Table.HeaderCell>Product ID</Table.HeaderCell>
                    <Table.HeaderCell>Variant ID</Table.HeaderCell>
                    <Table.HeaderCell>Created</Table.HeaderCell>
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
              <Text className="text-ui-fg-subtle">
                No favorite records for this customer.
              </Text>
            )}
          </SectionCard>

          <SectionCard title="Active subscription">
            {subscription?.subscription ? (
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryItem
                  label="Plan"
                  value={subscription.subscription.plan_name}
                />
                <SummaryItem
                  label="Status"
                  value={subscription.subscription.status}
                />
                <SummaryItem
                  label="Amount"
                  value={formatCurrency(
                    subscription.subscription.amount,
                    subscription.subscription.currency_code
                  )}
                />
                <SummaryItem
                  label="Started at"
                  value={formatDateTime(subscription.subscription.started_at)}
                />
                <SummaryItem
                  label="Expires at"
                  value={formatDateTime(subscription.subscription.expires_at)}
                />
                <SummaryItem
                  label="Next billing"
                  value={formatDateTime(
                    subscription.subscription.next_billing_at
                  )}
                />
              </div>
            ) : (
              <Text className="text-ui-fg-subtle">
                No active subscription for this customer.
              </Text>
            )}
          </SectionCard>

          <SectionCard title="Audit logs">
            {auditLogs && auditLogs.audit_logs.length > 0 ? (
              <>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Created</Table.HeaderCell>
                      <Table.HeaderCell>Action</Table.HeaderCell>
                      <Table.HeaderCell>Actor</Table.HeaderCell>
                      <Table.HeaderCell>Before</Table.HeaderCell>
                      <Table.HeaderCell>After</Table.HeaderCell>
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
                  onNext={() =>
                    setAuditOffset((current) => current + AUDIT_LOG_LIMIT)
                  }
                />
              </>
            ) : (
              <Text className="text-ui-fg-subtle">No audit logs yet.</Text>
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  )
}
