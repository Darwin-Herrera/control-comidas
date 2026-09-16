import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  async function cargarPerfil(user) {
    if (!user) { setPerfil(null); return }
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
    if (error) console.error(error)
    setPerfil(data || null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await cargarPerfil(data.session?.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      await cargarPerfil(newSession?.user)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()
  const refreshPerfil = () => cargarPerfil(session?.user)

  return <AuthContext.Provider value={{
    session, user: session?.user || null, perfil, loading, signOut, refreshPerfil,
    esAdminLocal: ['admin_local','superadmin'].includes(perfil?.rol),
    esSuperadmin: perfil?.rol === 'superadmin'
  }}>{children}</AuthContext.Provider>
}
