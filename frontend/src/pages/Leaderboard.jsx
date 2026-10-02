import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { api, getToken, wsUrl } from "../api"
import { useAuth } from "../Auth"

export default function Leaderboard() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [me, setMe] = useState(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    const board = await api("/api/leaderboard/")
    setRows(board.results || [])
    if (getToken()) {
      try {
        setMe(await api("/api/leaderboard/me/"))
      } catch {
        setMe(null)
      }
    } else {
      setMe(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setError("")
    load().catch((err) => {
      if (!cancelled) setError(err.message)
    })
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    if (!getToken()) return undefined
    const socket = new WebSocket(wsUrl("/ws/leaderboard/"))
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === "ranks_changed") {
          load().catch(() => {})
        }
      } catch {
        /* ignore */
      }
    }
    return () => socket.close()
  }, [load, user])

  if (error) return <p className="error">{error}</p>

  return (
    <div className="card">
      <h1>Leaderboard</h1>
      {user && me ? (
        <p className="muted">
          You: rank {me.rank ?? "unranked"} · score {me.score}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="muted">No scores yet. First accepted solutions will show up here.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.user_id}>
                <td>{row.rank}</td>
                <td>
                  <Link to={`/u/${row.username}`}>{row.username || `#${row.user_id}`}</Link>
                </td>
                <td>{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
