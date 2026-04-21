import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'
const DEV_USER = { id: '00000000-0000-0000-0000-000000000001' }

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEV_MODE) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = DEV_MODE
    ? { user: DEV_USER, session: null, signOut: async () => {}, loading: false }
    : { user, session, signOut, loading }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
