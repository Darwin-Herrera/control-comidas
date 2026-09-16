import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { Utensils, ReceiptText, LayoutDashboard } from 'lucide-react'
export default function Inicio(){
 const {perfil,esAdminLocal}=useAuth(); const hoy=new Intl.DateTimeFormat('es-HN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())
 return <Layout><div className="page"><div className="hero"><span>{hoy}</span><h1>Hola, {perfil?.nombre?.split(' ')[0] || 'Usuario'} 👋</h1><p>¿Qué deseas hacer hoy?</p></div>
 <div className="quick-grid"><Link className="quick-card" to="/pedido"><Utensils/><h3>Hacer pedido</h3><p>Selecciona tu comida del día.</p></Link>
 <Link className="quick-card" to="/consumo"><ReceiptText/><h3>Mi consumo</h3><p>Consulta tu quincena o mes.</p></Link>
 {esAdminLocal&&<Link className="quick-card" to="/admin"><LayoutDashboard/><h3>Administración</h3><p>Ventas, pedidos y operación.</p></Link>}</div></div></Layout>
}
