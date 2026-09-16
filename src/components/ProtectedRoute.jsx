import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div className="center-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!perfil?.activo) return <div className="center-screen">Tu cuenta está desactivada.</div>
  if (roles && !roles.includes(perfil?.rol)) return <Navigate to="/" replace />
  return children
}
