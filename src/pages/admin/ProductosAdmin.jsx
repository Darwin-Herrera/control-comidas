import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../services/supabase'
import {
  Plus,
  Save,
  Utensils,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export default function ProductosAdmin() {

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [tipoMsg, setTipoMsg] = useState('ok')

  /* =========================================================
     NUEVO PRODUCTO
  ========================================================= */

  const [nuevo, setNuevo] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    activo: true
  })

  /* =========================================================
     CARGAR PRODUCTOS
  ========================================================= */

  const load = async () => {

    setLoading(true)

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('orden', { ascending: true })

    if (error) {

      console.error(error)

      setTipoMsg('error')
      setMsg('No se pudieron cargar los productos.')

    } else {

      setRows(data || [])

    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  /* =========================================================
     CATEGORÍAS EXISTENTES
  ========================================================= */

  const categorias = [
    ...new Set(
      rows
        .map(p => p.categoria)
        .filter(Boolean)
    )
  ]

  /* =========================================================
     CREAR NUEVO PRODUCTO
  ========================================================= */

  const agregarProducto = async () => {

    const nombre = nuevo.nombre.trim()
    const categoria = nuevo.categoria.trim()
    const precio = Number(nuevo.precio)

    if (!nombre) {

      setTipoMsg('error')
      setMsg('Escribe el nombre de la comida.')
      return
    }

    if (!categoria) {

      setTipoMsg('error')
      setMsg('Escribe o selecciona una categoría.')
      return
    }

    if (
      nuevo.precio === '' ||
      isNaN(precio) ||
      precio <= 0
    ) {

      setTipoMsg('error')
      setMsg('Ingresa un precio válido.')
      return
    }

    /* Evitar nombres repetidos */

    const existe = rows.some(
      p =>
        String(p.nombre)
          .trim()
          .toLowerCase() ===
        nombre.toLowerCase()
    )

    if (existe) {

      setTipoMsg('error')
      setMsg('Ya existe una comida con ese nombre.')
      return
    }

    setGuardando(true)
    setMsg('')

    /*
      El nuevo producto se coloca al final del menú.
    */

    const maxOrden = rows.reduce(
      (max, p) =>
        Math.max(
          max,
          Number(p.orden || 0)
        ),
      0
    )

    const { error } = await supabase
      .from('productos')
      .insert({
        nombre,
        categoria,
        precio,
        activo: nuevo.activo,
        orden: maxOrden + 1
      })

    if (error) {

      console.error(error)

      setTipoMsg('error')
      setMsg(
        'No se pudo agregar la comida: ' +
        error.message
      )

      setGuardando(false)
      return
    }

    /* Limpiar formulario */

    setNuevo({
      nombre: '',
      categoria: '',
      precio: '',
      activo: true
    })

    setTipoMsg('ok')
    setMsg('¡Nueva comida agregada correctamente!')

    await load()

    setGuardando(false)
  }

  /* =========================================================
     EDITAR PRODUCTO EXISTENTE
  ========================================================= */

  const save = async producto => {

    if (!producto.nombre?.trim()) {

      setTipoMsg('error')
      setMsg('El nombre del producto no puede quedar vacío.')
      return
    }

    if (!producto.categoria?.trim()) {

      setTipoMsg('error')
      setMsg('La categoría no puede quedar vacía.')
      return
    }

    if (
      producto.precio === '' ||
      Number(producto.precio) <= 0
    ) {

      setTipoMsg('error')
      setMsg('El precio debe ser mayor que cero.')
      return
    }

    const { error } = await supabase
      .from('productos')
      .update({
        nombre: producto.nombre.trim(),
        categoria: producto.categoria.trim(),
        precio: Number(producto.precio),
        activo: producto.activo
      })
      .eq('id', producto.id)

    if (error) {

      setTipoMsg('error')
      setMsg(
        'No se pudo guardar: ' +
        error.message
      )

      return
    }

    setTipoMsg('ok')
    setMsg(
      `¡${producto.nombre} actualizado correctamente!`
    )

    await load()
  }

  /* =========================================================
     ACTUALIZAR ESTADO LOCAL DE UNA FILA
  ========================================================= */

  const actualizarFila = (index, campo, valor) => {

    setRows(actual =>
      actual.map((producto, i) =>
        i === index
          ? {
              ...producto,
              [campo]: valor
            }
          : producto
      )
    )
  }

  /* =========================================================
     PANTALLA
  ========================================================= */

  return (

    <Layout>

      <div className="page productos-admin-page">

        {/* ===================================================
            CABECERA
        =================================================== */}

        <div className="page-title">

          <div>

            <h1>
              Productos y precios
            </h1>

            <p>
              Administra las comidas disponibles,
              categorías y precios del menú.
            </p>

          </div>

        </div>


        {/* ===================================================
            NUEVA COMIDA
        =================================================== */}

        <div className="new-product-panel">

          <div className="new-product-title">

            <div className="new-product-icon">
              <Utensils size={22} />
            </div>

            <div>

              <h2>
                Agregar nueva comida
              </h2>

              <p>
                La comida aparecerá automáticamente
                en el menú de pedidos si está activa.
              </p>

            </div>

          </div>


          <div className="new-product-form">

            {/* NOMBRE */}

            <div className="product-field">

              <label>
                Nombre de la comida
              </label>

              <input
                type="text"
                placeholder="Ej. Pollo con tajadas"
                value={nuevo.nombre}
                onChange={e =>
                  setNuevo({
                    ...nuevo,
                    nombre: e.target.value
                  })
                }
              />

            </div>


            {/* CATEGORÍA */}

            <div className="product-field">

              <label>
                Categoría
              </label>

              <input
                type="text"
                list="categorias-productos"
                placeholder="Ej. Almuerzos"
                value={nuevo.categoria}
                onChange={e =>
                  setNuevo({
                    ...nuevo,
                    categoria: e.target.value
                  })
                }
              />

              <datalist id="categorias-productos">

                {categorias.map(cat => (

                  <option
                    key={cat}
                    value={cat}
                  />

                ))}

              </datalist>

            </div>


            {/* PRECIO */}

            <div className="product-field">

              <label>
                Precio
              </label>

              <div className="price-input">

                <span>L</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={nuevo.precio}
                  onChange={e =>
                    setNuevo({
                      ...nuevo,
                      precio: e.target.value
                    })
                  }
                />

              </div>

            </div>


            {/* ACTIVO */}

            <div className="product-field product-active-field">

              <label>
                Estado
              </label>

              <label className="product-check">

                <input
                  type="checkbox"
                  checked={nuevo.activo}
                  onChange={e =>
                    setNuevo({
                      ...nuevo,
                      activo: e.target.checked
                    })
                  }
                />

                <span>
                  Activo
                </span>

              </label>

            </div>


            {/* BOTÓN */}

            <div className="product-field product-add-action">

              <label>&nbsp;</label>

              <button
                type="button"
                className="primary product-add-btn"
                onClick={agregarProducto}
                disabled={guardando}
              >

                <Plus size={18} />

                {guardando
                  ? 'Agregando...'
                  : 'Agregar comida'}

              </button>

            </div>

          </div>

        </div>


        {/* ===================================================
            MENSAJE
        =================================================== */}

        {msg && (

          <div
            className={
              tipoMsg === 'error'
                ? 'product-message error'
                : 'product-message success'
            }
          >

            {tipoMsg === 'error'
              ? <AlertCircle size={19} />
              : <CheckCircle2 size={19} />
            }

            <span>
              {msg}
            </span>

          </div>

        )}


        {/* ===================================================
            LISTADO
        =================================================== */}

        <div className="products-section-head">

          <div>

            <h2>
              Menú actual
            </h2>

            <p>
              {rows.length} comidas registradas
            </p>

          </div>

        </div>


        <div className="table-card products-table">

          <table>

            <thead>

              <tr>

                <th>
                  Producto
                </th>

                <th>
                  Categoría
                </th>

                <th>
                  Precio
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Acción
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="5"
                    className="empty-table"
                  >
                    Cargando productos...
                  </td>

                </tr>

              ) : rows.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="empty-table"
                  >
                    No hay productos registrados.
                  </td>

                </tr>

              ) : (

                rows.map((producto, index) => (

                  <tr key={producto.id}>

                    {/* PRODUCTO */}

                    <td>

                      <input
                        className="product-table-input"
                        value={producto.nombre || ''}
                        onChange={e =>
                          actualizarFila(
                            index,
                            'nombre',
                            e.target.value
                          )
                        }
                      />

                    </td>


                    {/* CATEGORÍA */}

                    <td>

                      <input
                        className="product-table-input"
                        list="categorias-productos"
                        value={producto.categoria || ''}
                        onChange={e =>
                          actualizarFila(
                            index,
                            'categoria',
                            e.target.value
                          )
                        }
                      />

                    </td>


                    {/* PRECIO */}

                    <td>

                      <div className="price-input table-price">

                        <span>L</span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={producto.precio}
                          onChange={e =>
                            actualizarFila(
                              index,
                              'precio',
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </td>


                    {/* ESTADO */}

                    <td>

                      <label className="product-check">

                        <input
                          type="checkbox"
                          checked={Boolean(producto.activo)}
                          onChange={e =>
                            actualizarFila(
                              index,
                              'activo',
                              e.target.checked
                            )
                          }
                        />

                        <span>
                          {producto.activo
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>

                      </label>

                    </td>


                    {/* GUARDAR */}

                    <td>

                      <button
                        type="button"
                        className="small-btn product-save-btn"
                        onClick={() =>
                          save(producto)
                        }
                      >

                        <Save size={16} />

                        Guardar

                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </Layout>
  )
}