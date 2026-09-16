import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../services/supabase'
import {
  CalendarDays,
  ShoppingBag,
  Users,
  Banknote,
  Plus,
  Minus,
  Pencil,
  X,
  MessageCircle
} from 'lucide-react'

/* ============================================================
   FECHAS
============================================================ */

const isoLocal = fecha => {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

const hoy = () => isoLocal(new Date())

/* ============================================================
   CALCULAR RANGO
============================================================ */

const calcularRango = tipo => {
  const actual = new Date()

  const year = actual.getFullYear()
  const month = actual.getMonth()

  /* HOY */

  if (tipo === 'hoy') {
    const fecha = isoLocal(actual)

    return {
      desde: fecha,
      hasta: fecha
    }
  }

  /* AYER */

  if (tipo === 'ayer') {
    const fecha = new Date(actual)

    fecha.setDate(fecha.getDate() - 1)

    const iso = isoLocal(fecha)

    return {
      desde: iso,
      hasta: iso
    }
  }

  /* QUINCENA */

  if (tipo === 'quincena') {
    if (actual.getDate() <= 15) {
      return {
        desde: isoLocal(
          new Date(
            year,
            month,
            1
          )
        ),

        hasta: isoLocal(
          new Date(
            year,
            month,
            15
          )
        )
      }
    }

    return {
      desde: isoLocal(
        new Date(
          year,
          month,
          16
        )
      ),

      hasta: isoLocal(
        new Date(
          year,
          month + 1,
          0
        )
      )
    }
  }

  /* MES */

  if (tipo === 'mes') {
    return {
      desde: isoLocal(
        new Date(
          year,
          month,
          1
        )
      ),

      hasta: isoLocal(
        new Date(
          year,
          month + 1,
          0
        )
      )
    }
  }

  return {
    desde: hoy(),
    hasta: hoy()
  }
}

/* ============================================================
   FORMATEAR FECHA
============================================================ */

const fechaBonita = fecha => {
  if (!fecha) return ''

  const [y, m, d] = fecha.split('-')

  return `${d}/${m}/${y}`
}

/* ============================================================
   COMPONENTE
============================================================ */

export default function PedidosAdmin() {
  const [rows, setRows] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [productos, setProductos] = useState([])
  const [uid, setUid] = useState('')

  /*
    HOY ES EL FILTRO PREDETERMINADO
  */

  const [periodo, setPeriodo] = useState('hoy')

  const rangoInicial = calcularRango('hoy')

  const [desde, setDesde] = useState(rangoInicial.desde)
  const [hasta, setHasta] = useState(rangoInicial.hasta)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)

  const [
    productoNuevo,
    setProductoNuevo
  ] = useState('')

  /* ============================================================
     USUARIOS
  ============================================================ */

  const cargarUsuarios = async () => {
    const { data, error } =
      await supabase
        .from('perfiles')
        .select(
          'id,nombre,apellido,correo,celular'
        )
        .eq('activo', true)
        .order('nombre')

    if (error) {
      console.error(
        'Error cargando usuarios:',
        error
      )

      return
    }

    setUsuarios(data || [])
  }

  /* ============================================================
     PRODUCTOS
  ============================================================ */

  const cargarProductos = async () => {
    const { data, error } =
      await supabase
        .from('productos')
        .select(
          'id,nombre,precio,activo'
        )
        .eq('activo', true)
        .order('orden')

    if (error) {
      console.error(error)
      return
    }

    setProductos(data || [])
  }

  /* ============================================================
     CARGAR PEDIDOS
  ============================================================ */

  const load = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('pedidos')
        .select(
          'id,fecha,usuario_id,estado'
        )
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order(
          'fecha',
          { ascending: false }
        )

      /*
        FILTRO DE USUARIO
      */

      if (uid) {
        query = query.eq(
          'usuario_id',
          uid
        )
      }

      const {
        data: pedidosData,
        error: pedidosError
      } = await query

      if (pedidosError) {
        throw pedidosError
      }

      const pedidos =
        pedidosData || []

      if (!pedidos.length) {
        setRows([])
        return
      }

      /* ========================================================
         DETALLES
      ======================================================== */

      const pedidoIds =
        pedidos.map(p => p.id)

      const {
        data: detallesData,
        error: detallesError
      } = await supabase
        .from('detalle_pedido')
        .select(
          'id,pedido_id,producto_id,cantidad,precio_unitario'
        )
        .in(
          'pedido_id',
          pedidoIds
        )

      if (detallesError) {
        throw detallesError
      }

      const detalles =
        detallesData || []

      /* ========================================================
         PRODUCTOS
      ======================================================== */

      const productoIds = [
        ...new Set(
          detalles
            .map(
              d => d.producto_id
            )
            .filter(Boolean)
        )
      ]

      let productosMap = {}

      if (productoIds.length) {
        const {
          data: productosData,
          error: productosError
        } = await supabase
          .from('productos')
          .select('id,nombre')
          .in(
            'id',
            productoIds
          )

        if (productosError) {
          throw productosError
        }

        productosMap =
          Object.fromEntries(
            (productosData || [])
              .map(p => [
                p.id,
                p
              ])
          )
      }

      /* ========================================================
         USUARIOS
      ======================================================== */

      const usuarioIds = [
        ...new Set(
          pedidos
            .map(
              p => p.usuario_id
            )
            .filter(Boolean)
        )
      ]

      let usuariosMap = {}

      if (usuarioIds.length) {
        const {
          data: perfilesData,
          error: perfilesError
        } = await supabase
          .from('perfiles')
          .select(
            'id,nombre,apellido,correo,celular'
          )
          .in(
            'id',
            usuarioIds
          )

        if (perfilesError) {
          throw perfilesError
        }

        usuariosMap =
          Object.fromEntries(
            (perfilesData || [])
              .map(u => [
                u.id,
                u
              ])
          )
      }

      /* ========================================================
         ARMAR RESULTADO
      ======================================================== */

      const resultado =
        pedidos.map(p => ({
          ...p,

          usuario:
            usuariosMap[
              p.usuario_id
            ] || {
              nombre: 'Usuario',
              apellido: '',
              correo: '',
              celular: ''
            },

          detalles:
            detalles
              .filter(
                d =>
                  d.pedido_id ===
                  p.id
              )
              .map(d => ({
                ...d,

                producto:
                  productosMap[
                    d.producto_id
                  ] || {
                    nombre:
                      'Producto'
                  }
              }))
        }))

      setRows(resultado)

    } catch (err) {
      console.error(
        'Error cargando pedidos:',
        err
      )

      setError(
        err.message ||
        'No se pudieron cargar los pedidos.'
      )

    } finally {
      setLoading(false)
    }
  }

  /* ============================================================
     INICIO
  ============================================================ */

  useEffect(() => {
    cargarUsuarios()
    cargarProductos()
  }, [])

  useEffect(() => {
    load()
  }, [
    uid,
    desde,
    hasta
  ])

  /* ============================================================
     CAMBIAR PERÍODO
  ============================================================ */

  const cambiarPeriodo = valor => {
    setPeriodo(valor)

    if (
      valor ===
      'personalizado'
    ) {
      return
    }

    const rango =
      calcularRango(valor)

    setDesde(rango.desde)
    setHasta(rango.hasta)
  }

  /* ============================================================
     CAMBIAR CANTIDAD
  ============================================================ */

  const cambiar = async (
    detalle,
    delta
  ) => {
    const nuevaCantidad =
      Math.max(
        1,
        Number(
          detalle.cantidad
        ) + delta
      )

    const { error } =
      await supabase
        .from('detalle_pedido')
        .update({
          cantidad:
            nuevaCantidad
        })
        .eq(
          'id',
          detalle.id
        )

    if (error) {
      alert(
        'No se pudo actualizar: ' +
        error.message
      )

      return
    }

    await load()
  }

  /* ============================================================
     AGREGAR PRODUCTO
  ============================================================ */

  const agregarProducto =
    async pedido => {

      if (!productoNuevo) {
        alert(
          'Selecciona un producto.'
        )

        return
      }

      const producto =
        productos.find(
          p =>
            String(p.id) ===
            String(
              productoNuevo
            )
        )

      if (!producto) return

      const existente =
        pedido.detalles.find(
          d =>
            String(
              d.producto_id
            ) ===
            String(
              producto.id
            )
        )

      if (existente) {
        const { error } =
          await supabase
            .from(
              'detalle_pedido'
            )
            .update({
              cantidad:
                Number(
                  existente.cantidad
                ) + 1
            })
            .eq(
              'id',
              existente.id
            )

        if (error) {
          alert(error.message)
          return
        }

      } else {
        const { error } =
          await supabase
            .from(
              'detalle_pedido'
            )
            .insert({
              pedido_id:
                pedido.id,

              producto_id:
                producto.id,

              cantidad: 1,

              precio_unitario:
                Number(
                  producto.precio
                )
            })

        if (error) {
          alert(error.message)
          return
        }
      }

      setProductoNuevo('')

      await load()
    }

  /* ============================================================
     TOTAL PEDIDO
  ============================================================ */

  const totalPedido =
    pedido =>
      (pedido.detalles || [])
        .reduce(
          (suma, detalle) =>
            suma +
            Number(
              detalle.cantidad || 0
            ) *
            Number(
              detalle.precio_unitario ||
              0
            ),
          0
        )

  /* ============================================================
     ESTADÍSTICAS
  ============================================================ */

  const resumen = useMemo(() => {
    const pedidos =
      rows.length

    const unidades =
      rows.reduce(
        (suma, pedido) =>
          suma +
          (pedido.detalles || [])
            .reduce(
              (x, detalle) =>
                x +
                Number(
                  detalle.cantidad ||
                  0
                ),
              0
            ),
        0
      )

    const venta =
      rows.reduce(
        (suma, pedido) =>
          suma +
          totalPedido(pedido),
        0
      )

    const usuariosUnicos =
      new Set(
        rows.map(
          p => p.usuario_id
        )
      ).size

    return {
      pedidos,
      unidades,
      venta,
      usuarios:
        usuariosUnicos
    }

  }, [rows])

  /* ============================================================
     TEXTO PERÍODO
  ============================================================ */

  const periodoTexto = () => {
    if (periodo === 'hoy')
      return 'Hoy'

    if (periodo === 'ayer')
      return 'Ayer'

    if (periodo === 'quincena')
      return 'Quincena actual'

    if (periodo === 'mes')
      return 'Mes actual'

    return 'Rango personalizado'
  }

  /* ============================================================
     USUARIO SELECCIONADO
  ============================================================ */

  const usuarioSeleccionado =
    usuarios.find(
      usuario =>
        String(usuario.id) ===
        String(uid)
    )

  /* ============================================================
     NOMBRE COMPLETO
  ============================================================ */

  const nombreCompletoUsuario =
    usuario => {
      if (!usuario) return ''

      return [
        usuario.nombre,
        usuario.apellido
      ]
        .filter(Boolean)
        .join(' ')
    }

  /* ============================================================
     WHATSAPP
  ============================================================ */

  const enviarWhatsApp = () => {
    if (!uid || !usuarioSeleccionado) {
      alert(
        'Selecciona un usuario para enviar el recordatorio.'
      )

      return
    }

    if (!usuarioSeleccionado.celular) {
      alert(
        'El usuario seleccionado no tiene un número de celular registrado.'
      )

      return
    }

    if (!rows.length) {
      alert(
        'El usuario seleccionado no tiene pedidos en este período.'
      )

      return
    }

    let telefono =
      String(
        usuarioSeleccionado.celular
      ).replace(/\D/g, '')

    /*
      Si el número tiene solamente
      8 dígitos asumimos Honduras.
    */

    if (telefono.length === 8) {
      telefono =
        `504${telefono}`
    }

    const nombre =
      nombreCompletoUsuario(
        usuarioSeleccionado
      )

    let rangoTexto = ''

    if (desde === hasta) {
      rangoTexto =
        `del ${fechaBonita(desde)}`
    } else {
      rangoTexto =
        `desde el ${fechaBonita(desde)} hasta el ${fechaBonita(hasta)}`
    }

    const mensaje =
      `Buen día ${nombre}, ` +
      `su deuda ${rangoTexto} es de un total de L ${resumen.venta.toFixed(2)}. ` +
      `Puede acreditar y enviar captura del recibo a la cuenta BAC 748488771 ` +
      `a nombre de Sandra Maribel Fomez Rendon. ` +
      `Muchas gracias de antemano.`

    const whatsappUrl =
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  /* ============================================================
     INTERFAZ
  ============================================================ */

  return (
    <Layout>

      <div className="page admin-pedidos-page">

        {/* CABECERA */}

        <div className="page-title">

          <div>

            <div className="pedido-eyebrow">

              <CalendarDays size={17} />

              ADMINISTRACIÓN

            </div>

            <h1>
              Pedidos
            </h1>

            <p className="muted">

              Consulta y administra
              los pedidos registrados.

            </p>

          </div>

        </div>


        {/* ====================================================
            FILTROS
        ==================================================== */}

        <div className="admin-filter-bar">

          <div className="admin-filter-group">

            <label>
              Período
            </label>

            <select
              value={periodo}
              onChange={e =>
                cambiarPeriodo(
                  e.target.value
                )
              }
            >

              <option value="hoy">
                Hoy
              </option>

              <option value="ayer">
                Ayer
              </option>

              <option value="quincena">
                Quincena actual
              </option>

              <option value="mes">
                Mes actual
              </option>

              <option value="personalizado">
                Personalizado
              </option>

            </select>

          </div>


          {periodo ===
            'personalizado' && (

            <>

              <div className="admin-filter-group">

                <label>
                  Desde
                </label>

                <input
                  type="date"
                  value={desde}
                  onChange={e =>
                    setDesde(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="admin-filter-group">

                <label>
                  Hasta
                </label>

                <input
                  type="date"
                  value={hasta}
                  min={desde}
                  onChange={e =>
                    setHasta(
                      e.target.value
                    )
                  }
                />

              </div>

            </>

          )}


          <div className="admin-filter-group admin-user-filter">

            <label>
              Usuario
            </label>

            <select
              value={uid}
              onChange={e =>
                setUid(
                  e.target.value
                )
              }
            >

              <option value="">
                Todos los usuarios
              </option>

              {usuarios.map(
                usuario => (

                  <option
                    key={usuario.id}
                    value={usuario.id}
                  >

                    {nombreCompletoUsuario(usuario)}

                  </option>

                )
              )}

            </select>

          </div>

        </div>


        {/* RANGO VISIBLE */}

        <div className="admin-range-info">

          <CalendarDays size={17} />

          <strong>
            {periodoTexto()}
          </strong>

          <span>
            {fechaBonita(desde)}

            {desde !== hasta &&
              ` — ${fechaBonita(hasta)}`
            }
          </span>

        </div>


        {/* ====================================================
            RESUMEN
        ==================================================== */}

        <div className="stats-grid admin-stats">

          <div className="stat-card">

            <ShoppingBag />

            <span>
              Pedidos
            </span>

            <strong>
              {resumen.pedidos}
            </strong>

          </div>


          <div className="stat-card">

            <Plus />

            <span>
              Unidades
            </span>

            <strong>
              {resumen.unidades}
            </strong>

          </div>


          <div className="stat-card">

            <Banknote />

            <span>
              Venta
            </span>

            <strong>

              L{' '}
              {resumen.venta.toFixed(2)}

            </strong>

          </div>


          <div className="stat-card">

            <Users />

            <span>
              Usuarios
            </span>

            <strong>
              {resumen.usuarios}
            </strong>

          </div>

        </div>


        {/* ====================================================
            RECORDATORIO WHATSAPP
        ==================================================== */}

        {uid && usuarioSeleccionado && (

          <div className="whatsapp-charge-card">

            <div className="whatsapp-charge-info">

              <div className="whatsapp-charge-icon">

                <MessageCircle size={22} />

              </div>


              <div className="whatsapp-charge-user">

                <strong>
                  Enviar recordatorio de pago
                </strong>

                <span>

                  {nombreCompletoUsuario(
                    usuarioSeleccionado
                  )}

                  {usuarioSeleccionado.celular
                    ? ` · ${usuarioSeleccionado.celular}`
                    : ' · Sin celular registrado'
                  }

                </span>

              </div>

            </div>


            <div className="whatsapp-charge-total">

              <span>
                Total del período
              </span>

              <strong>
                L {resumen.venta.toFixed(2)}
              </strong>

            </div>


            <button
              type="button"
              className="whatsapp-btn"
              onClick={
                enviarWhatsApp
              }
              disabled={
                !usuarioSeleccionado.celular ||
                !rows.length
              }
            >

              <MessageCircle size={18} />

              Enviar por WhatsApp

            </button>

          </div>

        )}


        {/* ERROR */}

        {error && (

          <div className="alert-error">
            {error}
          </div>

        )}


        {/* ====================================================
            TABLA
        ==================================================== */}

        {loading ? (

          <div className="admin-loading">
            Cargando pedidos...
          </div>

        ) : (

          <div className="table-card">

            <table>

              <thead>

                <tr>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Usuario
                  </th>

                  <th>
                    Detalle
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>


              <tbody>

                {!rows.length ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="empty-table"
                    >

                      No hay pedidos
                      para este período.

                    </td>

                  </tr>

                ) : (

                  rows.map(pedido => (

                    <tr key={pedido.id}>

                      {/* FECHA */}

                      <td>

                        <strong>

                          {fechaBonita(
                            pedido.fecha
                          )}

                        </strong>

                      </td>


                      {/* USUARIO */}

                      <td>

                        <strong>

                          {nombreCompletoUsuario(
                            pedido.usuario
                          )}

                        </strong>

                        {
                          pedido.usuario
                            .correo && (

                          <div className="muted">

                            {
                              pedido.usuario
                                .correo
                            }

                          </div>

                        )
                        }

                      </td>


                      {/* DETALLE */}

                      <td>

                        {pedido.detalles.map(
                          detalle => (

                            <div
                              className="admin-line"
                              key={
                                detalle.id
                              }
                            >

                              <span className="admin-product-name">

                                {
                                  detalle
                                    .producto
                                    .nombre
                                }

                              </span>


                              <button
                                type="button"
                                onClick={() =>
                                  cambiar(
                                    detalle,
                                    -1
                                  )
                                }
                              >

                                <Minus size={15} />

                              </button>


                              <b>

                                {
                                  detalle
                                    .cantidad
                                }

                              </b>


                              <button
                                type="button"
                                onClick={() =>
                                  cambiar(
                                    detalle,
                                    1
                                  )
                                }
                              >

                                <Plus size={15} />

                              </button>

                            </div>

                          )
                        )}


                        {/* AGREGAR PRODUCTO */}

                        {editando ===
                          pedido.id && (

                          <div className="admin-add-product">

                            <select
                              value={
                                productoNuevo
                              }
                              onChange={e =>
                                setProductoNuevo(
                                  e.target.value
                                )
                              }
                            >

                              <option value="">
                                Agregar producto...
                              </option>

                              {productos.map(
                                producto => (

                                  <option
                                    key={
                                      producto.id
                                    }
                                    value={
                                      producto.id
                                    }
                                  >

                                    {
                                      producto.nombre
                                    }

                                    {' - L '}

                                    {Number(
                                      producto.precio
                                    ).toFixed(
                                      2
                                    )}

                                  </option>

                                )
                              )}

                            </select>


                            <button
                              className="small-btn"
                              type="button"
                              onClick={() =>
                                agregarProducto(
                                  pedido
                                )
                              }
                            >

                              <Plus size={15} />

                              Agregar

                            </button>

                          </div>

                        )}

                      </td>


                      {/* TOTAL */}

                      <td>

                        <strong>

                          L{' '}

                          {totalPedido(
                            pedido
                          ).toFixed(2)}

                        </strong>

                      </td>


                      {/* ACCIONES */}

                      <td>

                        <button
                          className="small-btn admin-edit-btn"
                          type="button"
                          onClick={() => {

                            setEditando(
                              editando ===
                              pedido.id
                                ? null
                                : pedido.id
                            )

                            setProductoNuevo(
                              ''
                            )

                          }}
                        >

                          {editando ===
                          pedido.id ? (

                            <>
                              <X size={15} />
                              Cerrar
                            </>

                          ) : (

                            <>
                              <Pencil size={15} />
                              Editar pedido
                            </>

                          )}

                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </Layout>
  )
}