import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'

// mode: 'signin' | 'signup' | 'forgot' | 'magic'
const COPY = {
  signin: { title: 'Log in', sub: 'Staff reach the dashboard; clients see their project portal.', button: 'Sign in' },
  signup: { title: 'Create account', sub: 'Register with your email and a password you choose.', button: 'Create account' },
  forgot: { title: 'Reset password', sub: 'Enter your email and we will send you a reset link.', button: 'Send reset link' },
  magic: { title: 'Magic link', sub: 'We will email you a link that signs you in — no password needed.', button: 'Email me a link' },
}

export default function Login() {
  const { signIn, signUp, resetPassword, signInWithMagicLink, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function switchMode(next) {
    setMode(next); setError(''); setNotice('')
  }

  async function routeAfterLogin() {
    const { data: sess } = await supabase.auth.getSession()
    const uid = sess.session?.user?.id
    let dest = location.state?.from
    if (!dest && uid) {
      const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', uid).single()
      dest = prof?.is_admin ? '/admin' : '/portal'
    }
    navigate(dest || '/portal', { replace: true })
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email)
        if (error) throw error
        setNotice('If that email has an account, a reset link is on its way. Check your inbox.')
        return
      }
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email)
        if (error) throw error
        setNotice('Check your email for a sign-in link.')
        return
      }
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password, name)
        if (error) throw error
        if (!data.session) {
          setMode('signin')
          setNotice('Account created. If asked, confirm your email, then sign in below.')
          return
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
      await routeAfterLogin()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError('')
    const { error } = await signInWithGoogle()
    if (error) setError(error.message)
  }

  const cfg = COPY[mode]
  const showPassword = mode === 'signin' || mode === 'signup'
  const showOAuth = mode === 'signin' || mode === 'signup'

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center"><Logo /></Link>
        <div className="card mt-8">
          <h1 className="text-lg font-semibold">{cfg.title}</h1>
          <p className="mt-1 text-sm text-sand-400">{cfg.sub}</p>

          {showOAuth && (
            <>
              <button
                type="button"
                onClick={google}
                className="btn-ghost mt-6 flex w-full items-center justify-center gap-2.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.38 14.97.4 12 .4A11 11 0 0 0 2.18 6.94L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75z" />
                </svg>
                Continue with Google
              </button>
              <div className="my-5 flex items-center gap-3 text-xs text-sand-500">
                <span className="h-px flex-1 bg-ink-600" /> or <span className="h-px flex-1 bg-ink-600" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Name</label>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input required type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {showPassword && (
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className="field pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
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
            )}

            {notice && <p className="text-sm text-sand-200">{notice}</p>}
            {error && <p className="text-sm text-red-300">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Please wait…' : cfg.button}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-center text-xs">
            {mode === 'signin' && (
              <>
                <button onClick={() => switchMode('forgot')} className="block w-full text-sand-400 hover:text-sand-100">Forgot password?</button>
                <button onClick={() => switchMode('magic')} className="block w-full text-sand-400 hover:text-sand-100">Email me a magic link instead</button>
                <button onClick={() => switchMode('signup')} className="block w-full text-sand-400 hover:text-sand-100">Need an account? Create one</button>
              </>
            )}
            {mode === 'signup' && (
              <button onClick={() => switchMode('signin')} className="block w-full text-sand-400 hover:text-sand-100">Already have an account? Sign in</button>
            )}
            {(mode === 'forgot' || mode === 'magic') && (
              <button onClick={() => switchMode('signin')} className="block w-full text-sand-400 hover:text-sand-100">← Back to sign in</button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-sand-500">
          <Link to="/" className="hover:text-clay">← Back to site</Link>
        </p>
      </div>
    </div>
  )
}
