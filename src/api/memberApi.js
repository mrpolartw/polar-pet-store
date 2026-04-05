const BASE = `${import.meta.env.VITE_WP_API_URL}/mrpolar/v1`

async function apiFetch(path, options = {}) {
  const url = BASE + path
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (window.mrpolarData?.nonce) {
    headers['X-WP-Nonce'] = window.mrpolarData.nonce
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`

    try {
      const body = await res.json()
      message = body?.message || body?.data?.message || message
    } catch {
      // Ignore JSON parse failures and keep the HTTP status fallback.
    }

    throw new Error(message)
  }

  if (res.status === 204) {
    return null
  }

  return res.json()
}

export async function getMe() {
  return apiFetch('/member/me')
}

export async function updateMe(data) {
  try {
    return await apiFetch('/member/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (error) {
    if (String(error?.message || '').startsWith('HTTP 404') || String(error?.message || '').startsWith('HTTP 405')) {
      return apiFetch('/member/me', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }

    throw error
  }
}

export async function getAddresses() {
  return apiFetch('/member/me/addresses')
}

export async function createAddress(data) {
  return apiFetch('/member/me/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAddress(id, data) {
  return apiFetch(`/member/me/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAddress(id) {
  return apiFetch(`/member/me/addresses/${id}`, {
    method: 'DELETE',
  })
}

export async function getPets() {
  return apiFetch('/member/me/pets')
}

export async function createPet(data) {
  return apiFetch('/member/me/pets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePet(id, data) {
  return apiFetch(`/member/me/pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePet(id) {
  return apiFetch(`/member/me/pets/${id}`, {
    method: 'DELETE',
  })
}

export async function getPoints() {
  return apiFetch('/member/me/points')
}

export async function getTiers() {
  return apiFetch('/tiers')
}

export { apiFetch }
