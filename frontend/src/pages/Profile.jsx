import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { api } from "../api"
import { formatWhen, prettyVerdict, verdictClass } from "../format"

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [heatmap, setHeatmap] = useState([])
  const [subs, setSubs] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setError("")
    setProfile(null)
    Promise.all([
      api(`/api/users/${username}/`),
      api(`/api/users/${username}/heatmap/`),
      api(`/api/users/${username}/submissions/`),
    ])
      .then(([p, h, s]) => {
        if (cancelled) return
        setProfile(p)
        setHeatmap(h.results || [])
        setSubs(s)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [username])

  if (error) return <p className="error">{error}</p>
  if (!profile) return <p>Loading…</p>

  const solved = profile.solved || {}
  const rows = (subs && subs.results) || []

  return (
    <div className="card">
      <h1>{profile.username}</h1>
      <p>
        Score {profile.total_score} · streak {profile.current_streak} (best {profile.longest_streak})
      </p>
      <p className="muted">
        Solved easy {solved.easy ?? 0} · medium {solved.medium ?? 0} · hard {solved.hard ?? 0}
      </p>
      <h2>Activity</h2>
      <Heatmap days={heatmap} />
      <h2>Submissions</h2>
      {rows.length === 0 ? (
        <p className="muted">No submissions yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Problem</th>
              <th>Lang</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatWhen(row.created_at)}</td>
                <td>
                  <Link to={`/problems/${row.problem_slug}`}>{row.problem_slug}</Link>
                </td>
                <td>{row.language}</td>
                <td>
                  <span className={verdictClass(row.verdict)}>{prettyVerdict(row.verdict)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Heatmap({ days }) {
  const counts = useMemo(() => {
    const map = new Map()
    for (const row of days) {
      map.set(row.date, row.count)
    }
    return map
  }, [days])

  const cells = useMemo(() => {
    const out = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 364; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = localDay(d)
      out.push({ date: key, count: counts.get(key) || 0 })
    }
    return out
  }, [counts])

  return (
    <div className="heat" title="Last 365 days">
      {cells.map((c) => (
        <span
          key={c.date}
          className={`heat-cell n${level(c.count)}`}
          title={`${c.date}: ${c.count}`}
        />
      ))}
    </div>
  )
}

function localDay(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function level(n) {
  if (n <= 0) return 0
  if (n === 1) return 1
  if (n <= 3) return 2
  if (n <= 6) return 3
  return 4
}
