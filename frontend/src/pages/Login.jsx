import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../Auth"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    try {
      await login(username, password)
      navigate("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>Log in</h1>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit">Log in</button>
      <p className="muted">
        No account? <Link to="/register">Register</Link>
      </p>
    </form>
  )
}
