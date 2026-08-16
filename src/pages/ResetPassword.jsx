import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

// Users land here from the reset link in their email. Supabase establishes a
// short-lived recovery session automatically, so we just collect a new password.
export default function ResetPassword() {
  const { updatePassword, user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Use at least 6 characters.'); return }
    if (password !== confirm) { setError('The two passwords do not match.'); return }
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => navigate('/login', { replace: true }), 1800)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center"><Logo /></Link>
        <div className="card mt-8">
          <h1 className="text-lg font-semibold">Set a new password</h1>

          {done ? (
            <p className="mt-3 text-sm text-sand-200">
              Password updated. Taking you to sign in…
            </p>
          ) : !loading && !user ? (
            <p className="mt-3 text-sm text-sand-400">
              This reset link is invalid or has expired. Request a new one from the{' '}
              <Link to="/login" className="text-clay hover:underline">login page</Link>.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    required
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="field pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-sand-400 hover:text-sand-100"
                  >
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input
                  required
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-sand-500">
          <Link to="/login" className="hover:text-clay">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
