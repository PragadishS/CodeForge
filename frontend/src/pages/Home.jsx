import { Link } from "react-router-dom"

import { useAuth } from "../Auth"

export default function Home() {
  const { user, ready } = useAuth()

  if (!ready) return <p>Loading…</p>

  return (
    <div className="card">
      <h1>CodeForge</h1>
      {user ? (
        <p>
          Hi, {user.username}. Score {user.total_score} · streak {user.current_streak}
        </p>
      ) : (
        <p>A local judge: problems, submissions, live verdicts, and a leaderboard.</p>
      )}
      <p>
        <Link to="/problems">Browse problems</Link>
        {" · "}
        <Link to="/leaderboard">Leaderboard</Link>
        {user ? (
          <>
            {" · "}
            <Link to={`/u/${user.username}`}>Your profile</Link>
          </>
        ) : (
          <>
            {" · "}
            <Link to="/login">Log in</Link>
            {" · "}
            <Link to="/register">Register</Link>
          </>
        )}
      </p>
    </div>
  )
}
