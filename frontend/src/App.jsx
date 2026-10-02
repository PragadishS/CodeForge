import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AuthProvider } from "./Auth"
import Layout from "./Layout"
import Home from "./pages/Home"
import Leaderboard from "./pages/Leaderboard"
import Login from "./pages/Login"
import Problem from "./pages/Problem"
import Problems from "./pages/Problems"
import Profile from "./pages/Profile"
import Register from "./pages/Register"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problems/:slug" element={<Problem />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/u/:username" element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
