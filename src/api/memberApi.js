const normalizeApiRoot = (value) => {
  const normalized = String(value || '').replace(/\/$/, '')

  if (!normalized) {
    return ''
  }

  return /\/wp-json$/i.test(normalized) ? normalized : `${normalized}/wp-json`
}

const resolveApiRoot = () => {
  const explicitApiRoot = normalizeApiRoot(
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_WP_API_URL || ''
  )

  if (explicitApiRoot) {
    return explicitApiRoot
  }

  if (import.meta.env.DEV) {
    return '/wp-json'
  }

  return normalizeApiRoot(import.meta.env.VITE_WC_URL || '') || '/wp-json'
}

const API_ROOT = resolveApiRoot()
const BASE = `${API_ROOT}/mrpolar/v1`

const buildHeaders = (token, headers = {}) => {
  const nextHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`
  }

  return nextHeaders
}

const parseResponseBody = async (response) => {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const unwrapResponseData = (body) => {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data
  }

  return body
}

const shouldFallback = (error) => error?.status === 404 || error?.status === 405
let namespaceRouteMapPromise = null

const getNamespaceRouteMap = async () => {
  if (!namespaceRouteMapPromise) {
    namespaceRouteMapPromise = fetch(BASE, {
      method: 'GET',
      headers: buildHeaders(null),
      credentials: 'include',
    })
      .then(async (response) => {
        const body = await parseResponseBody(response)

        if (!response.ok || !body || typeof body !== 'object') {
          return {}
        }

        return body.routes && typeof body.routes === 'object' ? body.routes : {}
      })
      .catch(() => ({}))
  }

  return namespaceRouteMapPromise
}

const routeExists = async (routePath) => {
  const routes = await getNamespaceRouteMap()
  return Object.prototype.hasOwnProperty.call(routes, routePath)
}

async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers: buildHeaders(token, options.headers),
    body: options.body,
    credentials: 'include',
  })

  const body = await parseResponseBody(response)

  if (!response.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.message || body?.data?.message || `HTTP ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }

  return unwrapResponseData(body)
}

async function apiFetchWithFallback(requests, token) {
  const attemptList = Array.isArray(requests) ? requests : [requests]
  let lastError = null

  for (const request of attemptList) {
    const { path, ...options } = request

    try {
      return await apiFetch(path, token, options)
    } catch (error) {
      lastError = error

      if (!shouldFallback(error)) {
        break
      }
    }
  }

  throw lastError || new Error('Request failed')
}

const extractArray = (value) => (Array.isArray(value) ? value : [])

const extractProfileCollection = async (token, key) => {
  const profile = await apiFetchWithFallback([
    { path: '/customer/profile' },
    { path: '/me' },
  ], token)

  return extractArray(profile?.[key])
}

const toLegacyPet = (pet = {}) => ({
  id: pet.id ?? null,
  pet_uid: pet.pet_uid ?? pet.petUid ?? '',
  name: pet.name ?? pet.petName ?? '',
  type: pet.type ?? pet.petType ?? '',
  breed: pet.breed ?? pet.petBreed ?? '',
  gender: pet.gender ?? pet.petGender ?? '',
  birthday: pet.birthday ?? pet.petBirthday ?? '',
  age: pet.age ?? pet.petAge ?? null,
  weight: pet.weight ?? pet.petWeight ?? null,
  avatar_url: pet.avatar_url ?? pet.petAvatarUrl ?? '',
  note: pet.note ?? pet.petNote ?? '',
})

const saveLegacyPets = async (token, pets) => {
  await apiFetch('/customer/pets', token, {
    method: 'POST',
    body: JSON.stringify({
      pets: pets.map(toLegacyPet),
    }),
  })
}

// Member profile
export const getMember = (token) => apiFetchWithFallback([
  { path: '/member/profile' },
  { path: '/me' },
  { path: '/customer/profile' },
], token)

export const updateMember = (token, data) => apiFetchWithFallback([
  { path: '/member/profile', method: 'POST', body: JSON.stringify(data) },
  { path: '/me', method: 'PATCH', body: JSON.stringify(data) },
  { path: '/me', method: 'POST', body: JSON.stringify(data) },
  { path: '/customer/profile', method: 'POST', body: JSON.stringify(data) },
], token)

// Addresses
export const getAddresses = async (token) => {
  try {
    return await apiFetchWithFallback([
      { path: '/member/addresses' },
      { path: '/customer/addresses' },
    ], token)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return extractProfileCollection(token, 'addresses')
  }
}

export const createAddress = (token, data) => apiFetchWithFallback([
  { path: '/member/addresses', method: 'POST', body: JSON.stringify(data) },
  { path: '/customer/addresses', method: 'POST', body: JSON.stringify(data) },
], token)

export const updateAddress = (token, id, data) => apiFetchWithFallback([
  { path: `/member/addresses/${id}`, method: 'PUT', body: JSON.stringify(data) },
  { path: `/customer/addresses/${id}`, method: 'PUT', body: JSON.stringify(data) },
], token)

export const deleteAddress = (token, id) => apiFetchWithFallback([
  { path: `/member/addresses/${id}`, method: 'DELETE' },
  { path: `/customer/addresses/${id}`, method: 'DELETE' },
], token)

// Pets
export const getPets = async (token) => {
  try {
    return await apiFetch('/member/pets', token)
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return extractProfileCollection(token, 'pets')
  }
}

export const createPet = async (token, data) => {
  try {
    return await apiFetch('/member/pets', token, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    const currentPets = await getPets(token)
    const nextPet = toLegacyPet(data)
    await saveLegacyPets(token, [...currentPets, nextPet])
    return nextPet
  }
}

export const updatePet = async (token, id, data) => {
  try {
    return await apiFetch(`/member/pets/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    const currentPets = await getPets(token)
    const nextPets = currentPets.map((pet) => (
      Number(pet.id) === Number(id)
        ? { ...pet, ...toLegacyPet(data), id: pet.id }
        : pet
    ))
    const updatedPet = nextPets.find((pet) => Number(pet.id) === Number(id)) || toLegacyPet(data)
    await saveLegacyPets(token, nextPets)
    return updatedPet
  }
}

export const deletePet = async (token, id) => {
  try {
    return await apiFetch(`/member/pets/${id}`, token, {
      method: 'DELETE',
    })
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    const currentPets = await getPets(token)
    const nextPets = currentPets.filter((pet) => Number(pet.id) !== Number(id))
    await saveLegacyPets(token, nextPets)
    return { success: true }
  }
}

// Points
export const getPoints = (token) => apiFetchWithFallback([
  { path: '/member/points' },
  { path: '/customer/points' },
], token)

// Tiers
export const getTiers = async () => {
  if (!await routeExists('/mrpolar/v1/tiers')) {
    return []
  }

  return apiFetch('/tiers', null)
}

export { API_ROOT, BASE, apiFetch }
