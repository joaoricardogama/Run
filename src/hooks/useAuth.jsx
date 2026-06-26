import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [athlete, setAthlete] = useState(null)
  const [isCoach, setIsCoach] = useState(false)
  const [loading, setLoading] = useState(true)

  const COACH_EMAIL = import.meta.env.VITE_COACH_EMAIL || 'coach@runtejo.pt'

  async function fetchAthleteProfile(userEmail) {
    const { data } = await supabase
      .from('athletes')
      .select('*')
      .eq('email', userEmail)
      .single()
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const coach = u.email === COACH_EMAIL
        setIsCoach(coach)
        if (!coach) {
          const profile = await fetchAthleteProfile(u.email)
          setAthlete(profile)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const coach = u.email === COACH_EMAIL
        setIsCoach(coach)
        if (!coach) {
          const profile = await fetchAthleteProfile(u.email)
          setAthlete(profile)
        } else {
          setAthlete(null)
        }
      } else {
        setIsCoach(false)
        setAthlete(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshAthlete() {
    if (user && !isCoach) {
      const profile = await fetchAthleteProfile(user.email)
      setAthlete(profile)
    }
  }

  return (
    <AuthContext.Provider value={{ user, athlete, isCoach, loading, signIn, signOut, refreshAthlete }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
