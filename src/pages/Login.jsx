import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { data, error } = await signIn(email, password)
    if (error) { setBusy(false); setError(error.message); return }

    // Route by role. Admins land in the dashboard; everyone else in the portal.
    let dest = location.state?.from
    if (!dest) {
      const { data: prof } = await supabase
        .from('profiles').select('is_admin').eq('id', data.user.id).single()
      dest = prof?.is_admin ? '/admin' : '/portal'
    }
    setBusy(false)
    navigate(dest, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center"><Logo /></Link>
        <div className="card mt-8">
          <h1 className="text-lg font-semibold">Log in</h1>
          <p className="mt-1 text-sm text-sand-400">Staff reach the dashboard; clients see their project portal.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input required type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input required type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-sand-500">
          <Link to="/" className="hover:text-clay">← Back to site</Link>
        </p>
      </div>
    </div>
  )
}
