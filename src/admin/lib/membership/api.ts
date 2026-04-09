import type {
  AdjustPointsPayload,
  AdjustPointsResponse,
  AssignLevelPayload,
  AssignLevelResponse,
  DeleteResponse,
  MemberLevelPayload,
  MemberLevelUpdatePayload,
  MembershipCustomerAuditLogsResponse,
  MembershipCustomerFavoritesResponse,
  MembershipCustomerPointsResponse,
  MembershipCustomerPetsResponse,
  MembershipCustomerResponse,
  MembershipCustomersResponse,
  MembershipMemberLevelResponse,
  MembershipMemberLevelsResponse,
} from "./types"

type QueryValue = string | number | boolean | null | undefined

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

interface ListCustomersParams {
  q?: string
  limit?: number
  offset?: number
  order?: string
  has_account?: boolean
  groups?: string
}

interface PaginatedParams {
  limit?: number
  offset?: number
}

function buildQuery(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()

  return query ? `?${query}` : ""
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const maybeMessage = (payload as { message?: unknown }).message

    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      return maybeMessage
    }
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  return fallback
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  let body = options.body

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(body)
  }

  headers.set("Accept", "application/json")

  const response = await fetch(path, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
    credentials: "include",
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, `Request failed with status ${response.status}`)
    )
  }

  return payload as T
}

export function listMembershipCustomers(
  params: ListCustomersParams = {}
): Promise<MembershipCustomersResponse> {
  return request(
    `/admin/membership/customers${buildQuery({
      q: params.q,
      limit: params.limit,
      offset: params.offset,
      order: params.order,
      has_account: params.has_account,
      groups: params.groups,
    })}`
  )
}

export function getMembershipCustomer(
  id: string
): Promise<MembershipCustomerResponse> {
  return request(`/admin/membership/customers/${id}`)
}

export function getMembershipCustomerPoints(
  id: string,
  params: PaginatedParams = {}
): Promise<MembershipCustomerPointsResponse> {
  return request(
    `/admin/membership/customers/${id}/points${buildQuery({
      limit: params.limit,
      offset: params.offset,
    })}`
  )
}

export function listMembershipCustomerPets(
  id: string
): Promise<MembershipCustomerPetsResponse> {
  return request(`/admin/membership/customers/${id}/pets`)
}

export function listMembershipCustomerFavorites(
  id: string
): Promise<MembershipCustomerFavoritesResponse> {
  return request(`/admin/membership/customers/${id}/favorites`)
}

export function listMembershipCustomerAuditLogs(
  id: string,
  params: PaginatedParams = {}
): Promise<MembershipCustomerAuditLogsResponse> {
  return request(
    `/admin/membership/customers/${id}/audit-logs${buildQuery({
      limit: params.limit,
      offset: params.offset,
    })}`
  )
}

export function adjustMembershipPoints(
  id: string,
  payload: AdjustPointsPayload
): Promise<AdjustPointsResponse> {
  return request(`/admin/membership/customers/${id}/points/adjust`, {
    method: "POST",
    body: payload,
  })
}

export function assignMembershipLevel(
  id: string,
  payload: AssignLevelPayload
): Promise<AssignLevelResponse> {
  return request(`/admin/membership/customers/${id}/assign-level`, {
    method: "POST",
    body: payload,
  })
}

export function listMembershipMemberLevels(params: PaginatedParams & {
  is_active?: boolean
} = {}): Promise<MembershipMemberLevelsResponse> {
  return request(
    `/admin/membership/member-levels${buildQuery({
      limit: params.limit,
      offset: params.offset,
      is_active: params.is_active,
    })}`
  )
}

export function createMembershipMemberLevel(
  payload: MemberLevelPayload
): Promise<MembershipMemberLevelResponse> {
  return request("/admin/membership/member-levels", {
    method: "POST",
    body: payload,
  })
}

export function updateMembershipMemberLevel(
  id: string,
  payload: MemberLevelUpdatePayload
): Promise<MembershipMemberLevelResponse> {
  return request(`/admin/membership/member-levels/${id}`, {
    method: "PATCH",
    body: payload,
  })
}

export function deleteMembershipMemberLevel(
  id: string
): Promise<DeleteResponse> {
  return request(`/admin/membership/member-levels/${id}`, {
    method: "DELETE",
  })
}
