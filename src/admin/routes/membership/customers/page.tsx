import { defineRouteConfig } from "@medusajs/admin-sdk"
import { UserGroup } from "@medusajs/icons"
import { Button, Heading, Input, Table, Text } from "@medusajs/ui"
import { startTransition, useEffect, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  PaginationControls,
  SectionCard,
  StatePanel,
} from "../../../components/membership/ui"
import { listMembershipCustomers } from "../../../lib/membership/api"
import type {
  MembershipCustomer,
  MembershipCustomersResponse,
} from "../../../lib/membership/types"
import { getCustomerDisplayName } from "../../../lib/membership/utils"

const DEFAULT_LIMIT = 20

export const config = defineRouteConfig({
  label: "Membership",
  icon: UserGroup,
  nested: "/customers",
  rank: 50,
})

export default function MembershipCustomersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [response, setResponse] = useState<MembershipCustomersResponse | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const query = searchParams.get("q") ?? ""
  const offset = Number(searchParams.get("offset") ?? 0) || 0
  const limit =
    Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT

  const [searchValue, setSearchValue] = useState(query)

  useEffect(() => {
    setSearchValue(query)
  }, [query])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const nextResponse = await listMembershipCustomers({
          q: query || undefined,
          limit,
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
            : "Failed to load membership customers"
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
  }, [limit, offset, query, reloadKey])

  function updateSearchParams(next: {
    q?: string
    offset?: number
    limit?: number
  }) {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams)

      if (next.q && next.q.trim()) {
        nextParams.set("q", next.q.trim())
      } else {
        nextParams.delete("q")
      }

      nextParams.set("offset", String(next.offset ?? 0))
      nextParams.set("limit", String(next.limit ?? limit))

      setSearchParams(nextParams)
    })
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    updateSearchParams({
      q: searchValue,
      offset: 0,
      limit,
    })
  }

  function handleRowClick(customer: MembershipCustomer) {
    navigate(`/membership/customers/${customer.id}`)
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="space-y-1">
        <Heading level="h1">Membership customers</Heading>
        <Text className="text-ui-fg-subtle">
          Browse membership customers and open their detail pages for point and
          level management.
        </Text>
      </div>

      <SectionCard
        title="Customer list"
        description="Search by email, first name, or phone using the admin membership API."
      >
        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={handleSearchSubmit}
        >
          <Input
            placeholder="Search email, first name, or phone"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            disabled={loading}
          />
          <Button type="submit" isLoading={loading} disabled={loading}>
            Search
          </Button>
        </form>

        {loading ? (
          <StatePanel
            title="Loading customers"
            message="Fetching membership customer records..."
          />
        ) : null}

        {!loading && error ? (
          <StatePanel
            title="Could not load customers"
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

        {!loading && !error && response && response.customers.length === 0 ? (
          <StatePanel
            title="No customers found"
            message="Try a different keyword or clear the search filters."
            action={
              query ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchValue("")
                    updateSearchParams({ q: "", offset: 0, limit })
                  }}
                >
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {!loading && !error && response && response.customers.length > 0 ? (
          <>
            <Table className="overflow-hidden">
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Customer ID</Table.HeaderCell>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Phone</Table.HeaderCell>
                  <Table.HeaderCell>Member level</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {response.customers.map((customer) => (
                  <Table.Row
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(customer)}
                  >
                    <Table.Cell className="font-mono text-xs">
                      {customer.id}
                    </Table.Cell>
                    <Table.Cell>{customer.email ?? "-"}</Table.Cell>
                    <Table.Cell>{getCustomerDisplayName(customer)}</Table.Cell>
                    <Table.Cell>{customer.phone ?? "-"}</Table.Cell>
                    <Table.Cell>
                      {customer.membership_member_level?.name ?? "-"}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            <PaginationControls
              count={response.count}
              limit={response.limit || limit}
              offset={response.offset || offset}
              isLoading={loading}
              onPrevious={() =>
                updateSearchParams({
                  q: query,
                  limit,
                  offset: Math.max(0, offset - limit),
                })
              }
              onNext={() =>
                updateSearchParams({
                  q: query,
                  limit,
                  offset: offset + limit,
                })
              }
            />
          </>
        ) : null}
      </SectionCard>
    </div>
  )
}
