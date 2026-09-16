import { Routes,Route } from 'react-router-dom'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import NuevoPedido from './pages/NuevoPedido'
import MiConsumo from './pages/MiConsumo'
import Perfil from './pages/Perfil'
import Dashboard from './pages/admin/Dashboard'
import PedidosAdmin from './pages/admin/PedidosAdmin'
import ProductosAdmin from './pages/admin/ProductosAdmin'
import UsuariosAdmin from './pages/admin/UsuariosAdmin'
import Sistema from './pages/admin/Sistema'
import ProtectedRoute from './components/ProtectedRoute'
const P=({children,roles})=><ProtectedRoute roles={roles}>{children}</ProtectedRoute>
export default function App(){return <Routes>
<Route path="/login" element={<Login/>}/>
<Route path="/" element={<P><Inicio/></P>}/><Route path="/pedido" element={<P><NuevoPedido/></P>}/><Route path="/consumo" element={<P><MiConsumo/></P>}/><Route path="/perfil" element={<P><Perfil/></P>}/>
<Route path="/admin" element={<P roles={['admin_local','superadmin']}><Dashboard/></P>}/><Route path="/admin/pedidos" element={<P roles={['admin_local','superadmin']}><PedidosAdmin/></P>}/><Route path="/admin/productos" element={<P roles={['admin_local','superadmin']}><ProductosAdmin/></P>}/>
<Route path="/sistema/usuarios" element={<P roles={['superadmin']}><UsuariosAdmin/></P>}/><Route path="/sistema" element={<P roles={['superadmin']}><Sistema/></P>}/>
</Routes>}
