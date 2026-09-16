import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Minus,
  Plus,
  ShoppingCart,
  Search,
  CalendarDays,
  CheckCircle2
} from 'lucide-react'

/* ============================================================
   FECHA LOCAL
============================================================ */

const fechaLocalISO = () => {
  const ahora = new Date()

  const year = ahora.getFullYear()
  const month = String(ahora.getMonth() + 1).padStart(2, '0')
  const day = String(ahora.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const fechaBonita = () => {
  return new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/* ============================================================
   ICONOS
============================================================ */

const iconoCategoria = categoria => {
  const texto = String(categoria || '').toLowerCase()

  if (texto.includes('baleada')) return '🌮'
  if (texto.includes('tortilla')) return '🫓'
  if (texto.includes('desayuno')) return '🍳'
  if (texto.includes('almuerzo')) return '🍛'

  return '🍽️'
}

/* ============================================================
   COMPONENTE
============================================================ */

export default function NuevoPedido() {

  const { user } = useAuth()

  const [productos, setProductos] = useState([])
  const [cant, setCant] = useState({})

  const [categoria, setCategoria] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const [msg, setMsg] = useState('')
  const [exito, setExito] = useState(false)

  const hoy = fechaLocalISO()

  /* ============================================================
     CARGAR PRODUCTOS

     IMPORTANTE:
     NO buscamos pedidos anteriores.
     Cada entrada a esta pantalla empieza desde cero.
  ============================================================ */

  useEffect(() => {

    const cargar = async () => {

      setLoading(true)

      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('orden')

      if (error) {

        console.error(error)

        setMsg(
          'No se pudieron cargar los productos: ' +
          error.message
        )

      } else {

        setProductos(data || [])

      }

      /*
        Siempre comenzamos con cantidades vacías.
      */

      setCant({})

      setLoading(false)
    }

    cargar()

  }, [])

  /* ============================================================
     CAMBIAR CANTIDAD
  ============================================================ */

  const change = (id, delta) => {

    setCant(actual => ({

      ...actual,

      [id]: Math.max(
        0,
        Number(actual[id] || 0) + delta
      )

    }))

    setMsg('')
    setExito(false)
  }

  /* ============================================================
     TOTAL
  ============================================================ */

  const total = useMemo(() => {

    return productos.reduce((suma, producto) => {

      const cantidad =
        Number(cant[producto.id] || 0)

      return (
        suma +
        cantidad * Number(producto.precio || 0)
      )

    }, 0)

  }, [productos, cant])

  /* ============================================================
     TOTAL UNIDADES
  ============================================================ */

  const cantidadTotal = useMemo(() => {

    return Object.values(cant).reduce(
      (suma, cantidad) =>
        suma + Number(cantidad || 0),
      0
    )

  }, [cant])

  /* ============================================================
     CATEGORÍAS
  ============================================================ */

  const categorias = useMemo(() => {

    const lista = productos
      .map(p => p.categoria)
      .filter(Boolean)

    return [
      'Todos',
      ...Array.from(new Set(lista))
    ]

  }, [productos])

  /* ============================================================
     FILTRAR PRODUCTOS
  ============================================================ */

  const productosFiltrados = useMemo(() => {

    const texto =
      busqueda.trim().toLowerCase()

    return productos.filter(producto => {

      const categoriaCorrecta =
        categoria === 'Todos' ||
        producto.categoria === categoria

      const busquedaCorrecta =
        !texto ||
        String(producto.nombre || '')
          .toLowerCase()
          .includes(texto)

      return (
        categoriaCorrecta &&
        busquedaCorrecta
      )
    })

  }, [
    productos,
    categoria,
    busqueda
  ])

  /* ============================================================
     GUARDAR PEDIDO

     CADA CLICK CREA UN PEDIDO NUEVO.
     NO UPSERT.
     NO ACTUALIZA PEDIDOS ANTERIORES.
  ============================================================ */

  const guardar = async () => {

    if (busy) return

    const items = productos.filter(
      producto =>
        Number(cant[producto.id] || 0) > 0
    )

    if (!items.length) {

      setMsg(
        'Selecciona al menos un producto.'
      )

      return
    }

    setBusy(true)
    setMsg('')
    setExito(false)

    try {

      /* ========================================================
         CREAR CABECERA DEL PEDIDO
      ======================================================== */

      const {
        data: pedido,
        error: pedidoError
      } = await supabase
        .from('pedidos')
        .insert({
          usuario_id: user.id,
          fecha: hoy,
          estado: 'confirmado'
        })
        .select()
        .single()

      if (pedidoError) {
        throw pedidoError
      }

      /* ========================================================
         CREAR DETALLE
      ======================================================== */

      const detalles = items.map(producto => ({

        pedido_id: pedido.id,

        producto_id: producto.id,

        cantidad:
          Number(cant[producto.id]),

        /*
          Guardamos el precio del momento.

          Si mañana cambia el precio del producto,
          este pedido conserva su precio histórico.
        */

        precio_unitario:
          Number(producto.precio)

      }))

      const { error: detalleError } =
        await supabase
          .from('detalle_pedido')
          .insert(detalles)

      if (detalleError) {

        /*
          Si falla el detalle eliminamos la cabecera
          para no dejar un pedido vacío.
        */

        await supabase
          .from('pedidos')
          .delete()
          .eq('id', pedido.id)

        throw detalleError
      }

      /* ========================================================
         PEDIDO COMPLETADO

         MUY IMPORTANTE:
         RESETEAMOS TODO A CERO.
      ======================================================== */

      setCant({})

      setExito(true)

      setMsg(
        '¡Pedido enviado correctamente!'
      )

      /*
        Después de unos segundos quitamos solamente
        el aviso. Las cantidades continúan en cero.
      */

      setTimeout(() => {
        setExito(false)
        setMsg('')
      }, 4000)

    } catch (error) {

      console.error(
        'Error guardando pedido:',
        error
      )

      setMsg(
        'No se pudo registrar el pedido: ' +
        (error.message || 'Error desconocido')
      )

      setExito(false)

    } finally {

      setBusy(false)

    }
  }

  /* ============================================================
     CARGANDO
  ============================================================ */

  if (loading) {

    return (
      <Layout>

        <div className="page">

          <div className="pedido-loading">
            Cargando menú...
          </div>

        </div>

      </Layout>
    )
  }

  /* ============================================================
     INTERFAZ
  ============================================================ */

  return (

    <Layout>

      <div className="page pedido-page">

        {/* CABECERA */}

        <div className="pedido-header">

          <div>

            <div className="pedido-eyebrow">

              <CalendarDays size={17} />

              <span>
                PEDIDO DEL DÍA
              </span>

            </div>

            <h1>
              ¿Qué deseas comer hoy?
            </h1>

            <p className="pedido-fecha">
              {fechaBonita()}
            </p>

          </div>


          {/* MENSAJE DE ÉXITO */}

          {exito && (

            <div className="pedido-existente-box">

              <div className="pedido-existente-icon">

                <CheckCircle2 size={22} />

              </div>

              <div>

                <strong>
                  Pedido enviado
                </strong>

                <span>
                  Tu pedido quedó registrado correctamente.
                </span>

              </div>

            </div>

          )}

        </div>


        {/* ====================================================
            FILTROS
        ==================================================== */}

        <div className="pedido-tools">

          <div className="category-tabs">

            {categorias.map(cat => (

              <button
                type="button"
                key={cat}
                className={
                  categoria === cat
                    ? 'category-tab active'
                    : 'category-tab'
                }
                onClick={() =>
                  setCategoria(cat)
                }
              >

                <span>

                  {cat === 'Todos'
                    ? '🍽️'
                    : iconoCategoria(cat)}

                </span>

                {cat}

              </button>

            ))}

          </div>


          <div className="pedido-search">

            <Search size={20} />

            <input
              type="text"
              placeholder="Buscar comida..."
              value={busqueda}
              onChange={e =>
                setBusqueda(e.target.value)
              }
            />

          </div>

        </div>


        {/* ====================================================
            PRODUCTOS
        ==================================================== */}

        <div className="product-grid modern-grid">

          {productosFiltrados.map(producto => (

            <div
              className="product-card modern-product-card"
              key={producto.id}
            >

              <div className="product-info">

                <div className="food-icon">

                  {iconoCategoria(
                    producto.categoria
                  )}

                </div>

                <span className="category">

                  {producto.categoria}

                </span>

                <h3>
                  {producto.nombre}
                </h3>

                <div className="product-price">

                  <small>
                    Precio
                  </small>

                  <strong>

                    L{' '}
                    {Number(
                      producto.precio
                    ).toFixed(2)}

                  </strong>

                </div>

              </div>


              {/* CONTADOR */}

              <div className="stepper modern-stepper">

                <button
                  type="button"
                  disabled={
                    Number(
                      cant[producto.id] || 0
                    ) === 0
                  }
                  onClick={() =>
                    change(
                      producto.id,
                      -1
                    )
                  }
                >

                  <Minus size={18} />

                </button>


                <span>

                  {cant[producto.id] || 0}

                </span>


                <button
                  type="button"
                  onClick={() =>
                    change(
                      producto.id,
                      1
                    )
                  }
                >

                  <Plus size={18} />

                </button>

              </div>

            </div>

          ))}

        </div>


        {productosFiltrados.length === 0 && (

          <div className="empty-products">

            No encontramos productos
            con ese filtro.

          </div>

        )}


        {/* ====================================================
            BARRA TOTAL
        ==================================================== */}

        <div className="order-bar modern-order-bar">

          <div className="order-summary">

            <div className="order-count">

              <small>

                {cantidadTotal}{' '}

                {cantidadTotal === 1
                  ? 'producto'
                  : 'productos'}

              </small>

              <span>
                Total del pedido
              </span>

            </div>


            <div className="order-total">

              L {total.toFixed(2)}

            </div>

          </div>


          <button
            className="primary inline"
            type="button"
            onClick={guardar}
            disabled={
              busy ||
              cantidadTotal === 0
            }
          >

            <ShoppingCart size={19} />

            {busy
              ? 'Enviando...'
              : 'Confirmar pedido'}

          </button>

        </div>


        {/* MENSAJES */}

        {msg && !exito && (

          <div className="message">
            {msg}
          </div>

        )}

      </div>

    </Layout>
  )
}