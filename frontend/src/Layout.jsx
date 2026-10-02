import { Link, NavLink, useNavigate } from "react-router-dom"

import { useAuth } from "./Auth"

export default function Layout({ children }) {
  const { user, ready, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate("/")
  }

  return (
    <div className="shell">
      <header className="nav">
        <Link to="/" className="brand">
          CodeForge
        </Link>
        <nav>
          <NavLink to="/problems">Problems</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          {!ready ? null : user ? (
            <>
              <NavLink to={`/u/${user.username}`}>{user.username}</NavLink>
              <button type="button" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
