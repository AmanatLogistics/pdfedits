const TOKEN_KEY = 'faiz-admin-token'

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' } }
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* private mode */ } }

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`/api/${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your internet connection.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error || (res.status === 404 ? 'The admin server is not available on this deployment.' : `Request failed (${res.status}).`))
  return data
}
