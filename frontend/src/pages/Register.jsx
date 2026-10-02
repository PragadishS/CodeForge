import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "../Auth"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function onSubmit(e) {
    e.preventDefault()
    setError("")
    try {
      await register(username, email, password)
      navigate("/")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>Register</h1>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Password (min 8)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit">Create account</button>
      <p className="muted">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </form>
  )
}
