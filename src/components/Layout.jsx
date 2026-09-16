import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import {
  Home,
  Utensils,
  ReceiptText,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Shield,
  UserRound,
  LogOut
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'


const DEFAULT_CONFIG = {
  nombreSistema: 'Control Comidas',
  iniciales: 'CC',
  colorPrincipal: '#f59e0b',
  colorSidebar: '#111827',
  tema: 'claro',
  sidebarCompacto: false
}


const obtenerConfig = () => {

  try {

    const guardado =
      localStorage.getItem('control-comidas-config')

    return guardado
      ? {
          ...DEFAULT_CONFIG,
          ...JSON.parse(guardado)
        }
      : DEFAULT_CONFIG

  } catch {

    return DEFAULT_CONFIG

  }

}


export default function Layout({ children }) {

  const {
    perfil,
    esAdminLocal,
    esSuperadmin,
    signOut
  } = useAuth()

  const nav = useNavigate()

  const [config, setConfig] =
    useState(obtenerConfig)


  const aplicarConfig = (datos) => {

    const root = document.documentElement

    root.style.setProperty(
      '--app-primary',
      datos.colorPrincipal
    )

    root.style.setProperty(
      '--app-sidebar',
      datos.colorSidebar
    )

    document.body.classList.toggle(
      'dark-mode',
      datos.tema === 'oscuro'
    )

    document.body.classList.toggle(
      'sidebar-compact',
      datos.sidebarCompacto
    )

  }


  useEffect(() => {

    const actual = obtenerConfig()

    setConfig(actual)
    aplicarConfig(actual)


    const escucharCambios = event => {

      const nuevaConfig =
        event.detail || obtenerConfig()

      setConfig(nuevaConfig)
      aplicarConfig(nuevaConfig)

    }


    window.addEventListener(
      'app-config-changed',
      escucharCambios
    )


    return () => {

      window.removeEventListener(
        'app-config-changed',
        escucharCambios
      )

    }

  }, [])


  const salir = async () => {

    await signOut()

    nav('/login')

  }


  const Link = ({
    to,
    icon: Icon,
    children
  }) => (

    <NavLink
      to={to}
      title={
        config.sidebarCompacto
          ? children
          : undefined
      }
      className={({ isActive }) =>
        `nav-item ${isActive ? 'active' : ''}`
      }
    >

      <Icon size={19} />

      <span>{children}</span>

    </NavLink>

  )


  return (

    <div className="app-shell">

      <aside
        className="sidebar"
        style={{
          background: config.colorSidebar
        }}
      >

        <div className="brand">

          <div
            className="brand-mark"
            style={{
              background: config.colorPrincipal
            }}
          >
            {config.iniciales || 'CC'}
          </div>


          <div className="brand-info">

            <strong>
              {config.nombreSistema || 'Control Comidas'}
            </strong>

            <small>
              {perfil?.nombre || ''}
            </small>

          </div>

        </div>


        <nav>

          <div className="nav-label">
            MI CUENTA
          </div>

          <Link
            to="/"
            icon={Home}
          >
            Inicio
          </Link>

          <Link
            to="/pedido"
            icon={Utensils}
          >
            Hacer pedido
          </Link>

          <Link
            to="/consumo"
            icon={ReceiptText}
          >
            Mi consumo
          </Link>

          <Link
            to="/perfil"
            icon={UserRound}
          >
            Mi perfil
          </Link>


          {esAdminLocal && (
            <>

              <div className="nav-label">
                ADMINISTRACIÓN LOCAL
              </div>

              <Link
                to="/admin"
                icon={LayoutDashboard}
              >
                Dashboard
              </Link>

              <Link
                to="/admin/pedidos"
                icon={ShoppingBag}
              >
                Pedidos
              </Link>

              <Link
                to="/admin/productos"
                icon={Package}
              >
                Productos
              </Link>

            </>
          )}


          {esSuperadmin && (
            <>

              <div className="nav-label">
                SISTEMA
              </div>

              <Link
                to="/sistema/usuarios"
                icon={Users}
              >
                Usuarios y permisos
              </Link>

              <Link
                to="/sistema"
                icon={Shield}
              >
                Configuración
              </Link>

            </>
          )}

        </nav>


        <button
          className="logout"
          onClick={salir}
          title={
            config.sidebarCompacto
              ? 'Cerrar sesión'
              : undefined
          }
        >

          <LogOut size={18} />

          <span>
            Cerrar sesión
          </span>

        </button>

      </aside>


      <main className="main">

        <header
          className="mobile-head"
          style={{
            background: config.colorSidebar
          }}
        >

          <strong>
            {config.nombreSistema || 'Control Comidas'}
          </strong>

          <button
            onClick={salir}
            style={{
              background: config.colorPrincipal
            }}
          >
            Salir
          </button>

        </header>


        {children}

      </main>

    </div>

  )
}