import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-sand-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-lg font-semibold">No admin access</p>
        <p className="max-w-sm text-sm text-sand-400">
          This account is signed in but is not an admin. Ask an existing admin to set
          <code className="mx-1 rounded bg-ink-700 px-1.5 py-0.5 text-clay">is_admin = true</code>
          on your profile.
        </p>
      </div>
    )
  }

  return children
}
