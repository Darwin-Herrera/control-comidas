import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  Users,
  UserPlus,
  Mail,
  ShieldCheck,
  CircleCheck,
  Phone,
  X,
  Save,
  KeyRound,
  UserCog
} from 'lucide-react'

const formInicial = {
  nombre: '',
  apellido: '',
  celular: '',
  email: '',
  password: '',
  rol: 'usuario'
}

export default function UsuariosAdmin() {
  const { refreshPerfil } = useAuth()

  const [rows, setRows] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(formInicial)
  const [msg, setMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id,nombre,apellido,correo,celular,rol,activo')
      .order('nombre')

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setRows(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const invoke = async (body) => {
    const { data, error } =
      await supabase.functions.invoke('admin-users', {
        body
      })

    if (error) {
      throw new Error(error.message)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data
  }

  const abrirNuevo = () => {
    setForm(formInicial)
    setMsg('')
    setErrorMsg('')
    setModal(true)
  }

  const cerrar = () => {
    if (busy) return
    setModal(false)
  }

  const crear = async (e) => {
    e.preventDefault()

    try {
      setBusy(true)
      setMsg('')
      setErrorMsg('')

      await invoke({
        action: 'create',
        nombre: form.nombre,
        apellido: form.apellido,
        celular: form.celular,
        email: form.email,
        password: form.password,
        rol: form.rol
      })

      setModal(false)
      setForm(formInicial)

      setMsg('Usuario creado correctamente.')

      await load()

    } catch (e) {
      setErrorMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  const cambiarRol = async (u, nuevoRol) => {
    try {
      setMsg('')
      setErrorMsg('')

      await invoke({
        action: 'role',
        userId: u.id,
        rol: nuevoRol
      })

      setMsg('Rol actualizado correctamente.')

      await load()

      if (refreshPerfil) {
        await refreshPerfil()
      }

    } catch (e) {
      setErrorMsg(e.message)
    }
  }

  const cambiarEstado = async (u) => {
    try {
      setMsg('')
      setErrorMsg('')

      await invoke({
        action: 'active',
        userId: u.id,
        activo: !u.activo
      })

      setMsg(
        u.activo
          ? 'Usuario desactivado.'
          : 'Usuario activado.'
      )

      await load()

    } catch (e) {
      setErrorMsg(e.message)
    }
  }

  const cambiarPassword = async (u) => {
    const nombreCompleto =
      `${u.nombre || ''} ${u.apellido || ''}`.trim()

    const password = prompt(
      `Nueva contraseña temporal para ${nombreCompleto}:\n\nMínimo 8 caracteres.`
    )

    if (!password) return

    try {
      setMsg('')
      setErrorMsg('')

      await invoke({
        action: 'password',
        userId: u.id,
        password
      })

      setMsg(
        `Contraseña de ${nombreCompleto} actualizada.`
      )

    } catch (e) {
      setErrorMsg(e.message)
    }
  }

  const total = rows.length

  const activos =
    rows.filter(x => x.activo).length

  const administradores =
    rows.filter(
      x =>
        x.rol === 'admin_local' ||
        x.rol === 'superadmin'
    ).length

  const nombreRol = (rol) => {
    if (rol === 'superadmin') return 'Superadministrador'
    if (rol === 'admin_local') return 'Administrador local'
    return 'Usuario'
  }

  return (
    <Layout>
      <div className="page users-page">

        <div className="users-header">

          <div>
            <h1>
              <Users size={34}/>
              Usuarios y permisos
            </h1>

            <p>
              Administra las cuentas y permisos de acceso
              al sistema.
            </p>
          </div>

          <button
            className="primary inline new-user-btn"
            onClick={abrirNuevo}
          >
            <UserPlus size={20}/>
            Nuevo usuario
          </button>

        </div>

        <div className="stats-grid users-stats">

          <div className="stat-card">
            <span>Total usuarios</span>
            <strong>{total}</strong>
          </div>

          <div className="stat-card">
            <span>Usuarios activos</span>
            <strong>{activos}</strong>
          </div>

          <div className="stat-card">
            <span>Administradores</span>
            <strong>{administradores}</strong>
          </div>

        </div>

        {msg && (
          <div className="message success-message">
            {msg}
          </div>
        )}

        {errorMsg && (
          <div className="message error-message">
            {errorMsg}
          </div>
        )}

        <div className="table-card users-table">

          <table>

            <thead>
              <tr>
                <th>Usuario</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {rows.map(u => {

                const nombreCompleto =
                  `${u.nombre || ''} ${u.apellido || ''}`
                    .trim()

                const inicial =
                  (u.nombre || u.correo || 'U')
                    .charAt(0)
                    .toUpperCase()

                return (
                  <tr key={u.id}>

                    <td>
                      <div className="user-person">

                        <div className="user-avatar">
                          {inicial}
                        </div>

                        <div>
                          <strong>
                            {nombreCompleto || 'Sin nombre'}
                          </strong>

                          <small>
                            ID de usuario
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>

                      <div className="contact-line">
                        <Mail size={17}/>
                        {u.correo}
                      </div>

                      <div className="contact-line muted-contact">
                        <Phone size={17}/>
                        {u.celular || 'Sin celular'}
                      </div>

                    </td>

                    <td>

                      <div className="role-cell">
                        <ShieldCheck size={17}/>

                        <select
                          value={u.rol}
                          onChange={e =>
                            cambiarRol(
                              u,
                              e.target.value
                            )
                          }
                        >
                          <option value="usuario">
                            Usuario
                          </option>

                          <option value="admin_local">
                            Administrador local
                          </option>

                          <option value="superadmin">
                            Superadministrador
                          </option>
                        </select>

                      </div>

                    </td>

                    <td>
                      <span
                        className={
                          u.activo
                            ? 'status-user active'
                            : 'status-user inactive'
                        }
                      >
                        <CircleCheck size={17}/>
                        {u.activo
                          ? 'Activo'
                          : 'Inactivo'}
                      </span>
                    </td>

                    <td>

                      <div className="user-actions">

                        <button
                          className="small-btn"
                          onClick={() =>
                            cambiarPassword(u)
                          }
                          title="Cambiar contraseña"
                        >
                          <KeyRound size={16}/>
                        </button>

                        <button
                          className="small-btn"
                          onClick={() =>
                            cambiarEstado(u)
                          }
                        >
                          <UserCog size={16}/>

                          {u.activo
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              })}

              {!rows.length && (
                <tr>
                  <td colSpan="5">
                    No existen usuarios registrados.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {modal && (

        <div
          className="modal-overlay"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              cerrar()
            }
          }}
        >

          <div className="user-modal">

            <div className="modal-header">

              <div>
                <span className="modal-icon">
                  <UserPlus size={22}/>
                </span>

                <div>
                  <h2>Nuevo usuario</h2>
                  <p>
                    Crea una nueva cuenta de acceso.
                  </p>
                </div>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={cerrar}
              >
                <X size={20}/>
              </button>

            </div>

            <form
              onSubmit={crear}
              className="new-user-form"
            >

              <div className="form-two">

                <label>
                  Nombre
                  <input
                    value={form.nombre}
                    onChange={e =>
                      setForm({
                        ...form,
                        nombre: e.target.value
                      })
                    }
                    placeholder="Ej. Darwin"
                    required
                  />
                </label>

                <label>
                  Apellido
                  <input
                    value={form.apellido}
                    onChange={e =>
                      setForm({
                        ...form,
                        apellido: e.target.value
                      })
                    }
                    placeholder="Ej. Herrera"
                    required
                  />
                </label>

              </div>

              <label>
                Correo electrónico
                <input
                  type="email"
                  value={form.email}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                  placeholder="usuario@correo.com"
                  required
                />
              </label>

              <label>
                Número de celular
                <input
                  type="tel"
                  value={form.celular}
                  onChange={e =>
                    setForm({
                      ...form,
                      celular: e.target.value
                    })
                  }
                  placeholder="Ej. 9999-9999"
                  required
                />
              </label>

              <div className="form-two">

                <label>
                  Contraseña temporal
                  <input
                    type="password"
                    value={form.password}
                    onChange={e =>
                      setForm({
                        ...form,
                        password: e.target.value
                      })
                    }
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                  />
                </label>

                <label>
                  Rol
                  <select
                    value={form.rol}
                    onChange={e =>
                      setForm({
                        ...form,
                        rol: e.target.value
                      })
                    }
                  >
                    <option value="usuario">
                      Usuario
                    </option>

                    <option value="admin_local">
                      Administrador local
                    </option>

                    <option value="superadmin">
                      Superadministrador
                    </option>
                  </select>
                </label>

              </div>

              {errorMsg && (
                <div className="message error-message">
                  {errorMsg}
                </div>
              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={cerrar}
                  disabled={busy}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary inline"
                  disabled={busy}
                >
                  <Save size={18}/>

                  {busy
                    ? 'Creando...'
                    : 'Crear usuario'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </Layout>
  )
}