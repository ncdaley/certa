import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export function signOut() {
  return supabase.auth.signOut()
}

const AuthContext = createContext(null)

function defaultProfile(userId) {
  return { id: userId, onboarding_complete: false, disclaimer_accepted: false }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    console.log('Fetching profile for:', userId)

    try {
      // Step 1 — try to load an existing row
      const { data: existing, error: selectErr } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        3000
      )

      console.log('Profile fetch result:', existing, selectErr)

      if (existing) {
        setProfile(existing)
        return
      }

      // Step 2 — no row yet, insert defaults
      const { data: created, error: insertErr } = await withTimeout(
        supabase
          .from('profiles')
          .insert({ id: userId, onboarding_complete: false, disclaimer_accepted: false })
          .select()
          .single(),
        3000
      )

      console.log('Profile create result:', created, insertErr)
      setProfile(created ?? defaultProfile(userId))
    } catch (err) {
      console.log('Profile fetch timeout — using default:', err.message)
      setProfile(defaultProfile(userId))
    }
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session)
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) await fetchProfile(currentUser.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session)
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
