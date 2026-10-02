import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { api, isFinalVerdict, wsUrl } from "../api"
import { useAuth } from "../Auth"
import { prettyVerdict, verdictClass } from "../format"

const STARTERS = {
  python: "print()",
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
  return 0;
}
`,
}

export default function Problem() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [problem, setProblem] = useState(null)
  const [error, setError] = useState("")
  const [language, setLanguage] = useState("python")
  const [code, setCode] = useState(STARTERS.python)
  const [submitting, setSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [verdict, setVerdict] = useState("")
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    let cancelled = false
    api(`/api/problems/${slug}/`)
      .then((res) => {
        if (!cancelled) setProblem(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!submissionId) return undefined
    const socket = new WebSocket(wsUrl(`/ws/submissions/${submissionId}/`))
    let poll = null

    function apply(payload) {
      if (payload.verdict) setVerdict(payload.verdict)
      if (isFinalVerdict(payload.verdict)) {
        api(`/api/submissions/${submissionId}/`)
          .then(setDetail)
          .catch(() => {})
      }
    }

    socket.onmessage = (event) => {
      try {
        apply(JSON.parse(event.data))
      } catch {
        /* ignore */
      }
    }
    socket.onerror = () => {
      poll = setInterval(() => {
        api(`/api/submissions/${submissionId}/`)
          .then((row) => {
            setVerdict(row.verdict)
            if (isFinalVerdict(row.verdict)) {
              setDetail(row)
              clearInterval(poll)
            }
          })
          .catch(() => {})
      }, 1500)
    }

    return () => {
      socket.close()
      if (poll) clearInterval(poll)
    }
  }, [submissionId])

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    setDetail(null)
    setSubmitting(true)
    try {
      const res = await api(`/api/problems/${slug}/submissions/`, {
        method: "POST",
        body: { language, code },
      })
      setSubmissionId(res.id)
      setVerdict(res.verdict)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function onLanguage(next) {
    setLanguage(next)
    setCode(STARTERS[next] || "")
  }

  if (error && !problem) return <p className="error">{error}</p>
  if (!problem) return <p>Loading…</p>

  return (
    <div className="split">
      <div className="card">
        <p className="muted">
          <Link to="/problems">Problems</Link>
        </p>
        <h1>{problem.title}</h1>
        <p>
          <span className={`diff ${problem.difficulty}`}>{problem.difficulty}</span>
          {" · "}
          {problem.time_limit_ms} ms · {problem.memory_limit_kb} KB
          {(problem.tags || []).length
            ? ` · ${(problem.tags || []).map((t) => t.name).join(", ")}`
            : ""}
        </p>
        <pre className="prose">{problem.description}</pre>
        {problem.constraints ? (
          <>
            <h2>Constraints</h2>
            <pre className="prose">{problem.constraints}</pre>
          </>
        ) : null}
        <h2>Samples</h2>
        {(problem.samples || []).length === 0 ? (
          <p className="muted">No public samples.</p>
        ) : (
          (problem.samples || []).map((s) => (
            <div key={s.order} className="sample">
              <strong>Input</strong>
              <pre>{s.input_data}</pre>
              <strong>Expected</strong>
              <pre>{s.expected_output}</pre>
            </div>
          ))
        )}
      </div>
      <div className="card">
        <h2>Submit</h2>
        {user ? (
          <form onSubmit={onSubmit}>
            <label>
              Language
              <select value={language} onChange={(e) => onLanguage(e.target.value)}>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </label>
            <label>
              Code
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={16}
                spellCheck={false}
                required
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Submit"}
            </button>
          </form>
        ) : (
          <p>
            <Link to="/login">Log in</Link> to submit.
          </p>
        )}
        {submissionId ? (
          <div className="status">
            <p>
              Submission #{submissionId}{" "}
              <span className={verdictClass(verdict)}>{prettyVerdict(verdict)}</span>
            </p>
            {detail?.runtime_ms != null ? <p className="muted">{detail.runtime_ms} ms</p> : null}
            {detail?.error_message ? <pre className="prose">{detail.error_message}</pre> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
