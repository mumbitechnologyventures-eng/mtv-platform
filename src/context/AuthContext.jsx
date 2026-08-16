import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, name, company, email, is_admin')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      await loadProfile(s?.user?.id)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const value = {
    session,
    user: session?.user || null,
    profile,
    isAdmin: !!profile?.is_admin,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, name) =>
      supabase.auth.signUp({ email, password, options: { data: { name } } }),
    signOut: () => supabase.auth.signOut(),
    // Sends a reset link; the user lands on /reset-password to set a new password.
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    // Passwordless: emails a one-time login link.
    signInWithMagicLink: (email) =>
      supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      }),
    // OAuth: needs the Google provider enabled in Supabase to work.
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/login` },
      }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
