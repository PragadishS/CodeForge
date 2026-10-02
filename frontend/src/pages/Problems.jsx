import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { api } from "../api"

export default function Problems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = searchParams.get("page") || "1"
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setError("")
    api(`/api/problems/?page=${page}`)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  if (error) return <p className="error">{error}</p>
  if (!data) return <p>Loading…</p>

  const rows = data.results || []

  return (
    <div className="card">
      <h1>Problems</h1>
      {rows.length === 0 ? (
        <p className="muted">No published problems yet. Staff add them in Django Admin.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Tags</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.slug}>
                <td>
                  <Link to={`/problems/${p.slug}`}>{p.title}</Link>
                </td>
                <td>
                  <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
                </td>
                <td className="muted">{(p.tags || []).map((t) => t.name).join(", ") || "—"}</td>
                <td>{p.solved ? <span className="verdict ok">solved</span> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pager
        page={page}
        count={data.count}
        next={data.next}
        previous={data.previous}
        onPage={(nextPage) => setSearchParams({ page: String(nextPage) })}
      />
    </div>
  )
}

function Pager({ page, count, next, previous, onPage }) {
  const n = Number(page) || 1
  if (!count && !next && !previous) return null
  return (
    <p className="pager">
      <button type="button" disabled={!previous} onClick={() => onPage(n - 1)}>
        Previous
      </button>
      <span className="muted">Page {n}</span>
      <button type="button" disabled={!next} onClick={() => onPage(n + 1)}>
        Next
      </button>
    </p>
  )
}
