import { createContext, useContext, useEffect, useState } from "react"

import { api, clearTokens, getToken, setTokens } from "./api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  async function loadMe() {
    if (!getToken()) {
      setUser(null)
      return
    }
    try {
      const me = await api("/api/auth/me/")
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    }
  }

  useEffect(() => {
    loadMe().finally(() => setReady(true))
  }, [])

  async function login(username, password) {
    const tokens = await api("/api/auth/token/", {
      method: "POST",
      body: { username, password },
    })
    setTokens(tokens.access, tokens.refresh)
    await loadMe()
  }

  async function register(username, email, password) {
    await api("/api/auth/register/", {
      method: "POST",
      body: { username, email, password },
    })
    await login(username, password)
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, loadMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be inside AuthProvider")
  return value
}
