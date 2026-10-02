const API = import.meta.env.VITE_API_URL || ""

function wsBase() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}`
}

export function getToken() {
  return localStorage.getItem("access")
}

export function setTokens(access, refresh) {
  localStorage.setItem("access", access)
  if (refresh) localStorage.setItem("refresh", refresh)
}

export function clearTokens() {
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
}

export function wsUrl(path) {
  const token = getToken()
  const q = token ? `?token=${encodeURIComponent(token)}` : ""
  return `${wsBase()}${path}${q}`
}

function errorMessage(data) {
  if (!data) return "Request failed"
  if (typeof data.detail === "string") return data.detail
  if (Array.isArray(data)) return data.map(String).join(" ")
  if (typeof data === "object") {
    const parts = Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(" ")}`
      return `${key}: ${value}`
    })
    if (parts.length) return parts.join(" · ")
  }
  return "Request failed"
}

async function tryRefresh() {
  const refresh = localStorage.getItem("refresh")
  if (!refresh) return false
  try {
    const res = await fetch(`${API}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      clearTokens()
      return false
    }
    setTokens(data.access, data.refresh)
    return true
  } catch {
    return false
  }
}

export async function api(path, { method = "GET", body, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error("Cannot reach the API. Is Docker up, and did you restart npm run dev?")
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && retry && token) {
    const ok = await tryRefresh()
    if (ok) {
      return api(path, { method, body, retry: false })
    }
  }
  if (!res.ok) {
    throw new Error(errorMessage(data))
  }
  return data
}

export function isFinalVerdict(verdict) {
  return verdict && verdict !== "queued" && verdict !== "running"
}
