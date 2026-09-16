import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import {
  CalendarDays,
  ChevronDown,
  ReceiptText,
  ShoppingBag,
  Wallet
} from 'lucide-react'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const DIAS = [
  'domingo', 'lunes', 'martes', 'miércoles',
  'jueves', 'viernes', 'sábado'
]

const isoLocal = d => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

const fechaDesdeISO = fecha => {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const fechaLarga = fecha => {
  const d = fechaDesdeISO(fecha)

  return `${DIAS[d.getDay()].charAt(0).toUpperCase() +
    DIAS[d.getDay()].slice(1)} ${d.getDate()} de ${
    MESES[d.getMonth()]
  } de ${d.getFullYear()}`
}

const obtenerRango = tipo => {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = hoy.getMonth()

  if (tipo === 'quincenaActual') {
    return hoy.getDate() <= 15
      ? [new Date(y, m, 1), new Date(y, m, 15)]
      : [new Date(y, m, 16), new Date(y, m + 1, 0)]
  }

  if (tipo === 'quincenaAnterior') {
    if (hoy.getDate() <= 15) {
      const mesAnterior = new Date(y, m - 1, 1)
      return [
        new Date(
          mesAnterior.getFullYear(),
          mesAnterior.getMonth(),
          16
        ),
        new Date(
          mesAnterior.getFullYear(),
          mesAnterior.getMonth() + 1,
          0
        )
      ]
    }

    return [
      new Date(y, m, 1),
      new Date(y, m, 15)
    ]
  }

  if (tipo === 'mesActual') {
    return [
      new Date(y, m, 1),
      new Date(y, m + 1, 0)
    ]
  }

  if (tipo === 'mesAnterior') {
    return [
      new Date(y, m - 1, 1),
      new Date(y, m, 0)
    ]
  }

  return [new Date(y, m, 1), new Date(y, m + 1, 0)]
}

const textoRango = (desde, hasta) => {
  if (!desde || !hasta) return ''

  const a = fechaDesdeISO(desde)
  const b = fechaDesdeISO(hasta)

  if (
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  ) {
    return `${a.getDate()} al ${b.getDate()} de ${
      MESES[a.getMonth()]
    } de ${a.getFullYear()}`
  }

  return `${a.getDate()} de ${MESES[a.getMonth()]} de ${
    a.getFullYear()
  } al ${b.getDate()} de ${MESES[b.getMonth()]} de ${
    b.getFullYear()
  }`
}

export default function MiConsumo() {
  const { user } = useAuth()

  const [tipo, setTipo] = useState('quincenaActual')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const inicial = obtenerRango('quincenaActual')

  const [desde, setDesde] = useState(isoLocal(inicial[0]))
  const [hasta, setHasta] = useState(isoLocal(inicial[1]))

  useEffect(() => {
    if (tipo === 'personalizado') return

    const [a, b] = obtenerRango(tipo)
    setDesde(isoLocal(a))
    setHasta(isoLocal(b))
  }, [tipo])

  useEffect(() => {
    if (!user?.id || !desde || !hasta) return

    const cargar = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          fecha,
          estado,
          detalle_pedido(
            cantidad,
            precio_unitario,
            productos(nombre)
          )
        `)
        .eq('usuario_id', user.id)
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha', { ascending: false })

      if (error) {
        console.error(error)
        setRows([])
      } else {
        setRows(data || [])
      }

      setLoading(false)
    }

    cargar()
  }, [user?.id, desde, hasta])

  const total = useMemo(() => {
    return rows.reduce(
      (s, p) =>
        s +
        (p.detalle_pedido || []).reduce(
          (x, d) =>
            x +
            Number(d.cantidad) *
              Number(d.precio_unitario),
          0
        ),
      0
    )
  }, [rows])

  const cantidadProductos = useMemo(() => {
    return rows.reduce(
      (s, p) =>
        s +
        (p.detalle_pedido || []).reduce(
          (x, d) => x + Number(d.cantidad),
          0
        ),
      0
    )
  }, [rows])

  return (
    <Layout>
      <div className="page consumo-page">

        <div className="page-title consumo-header">
          <div>
            <div className="eyebrow">
              <CalendarDays size={17} />
              HISTORIAL DE CONSUMO
            </div>

            <h1>Mi consumo</h1>

            <p className="muted">
              Consulta tus pedidos por quincena, mes o
              un período específico.
            </p>
          </div>

          <div className="period-select-wrap">
            <ChevronDown
              size={17}
              className="period-chevron"
            />

            <select
              className="period-select"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
            >
              <option value="quincenaActual">
                Quincena actual
              </option>

              <option value="quincenaAnterior">
                Quincena anterior
              </option>

              <option value="mesActual">
                Mes actual
              </option>

              <option value="mesAnterior">
                Mes anterior
              </option>

              <option value="personalizado">
                Personalizado
              </option>
            </select>
          </div>
        </div>

        <div className="period-banner">
          <CalendarDays size={22} />

          <div>
            <span>Período consultado</span>
            <strong>
              {textoRango(desde, hasta)}
            </strong>
          </div>
        </div>

        {tipo === 'personalizado' && (
          <div className="custom-period">
            <div>
              <label>Desde</label>
              <input
                type="date"
                value={desde}
                onChange={e => setDesde(e.target.value)}
              />
            </div>

            <div>
              <label>Hasta</label>
              <input
                type="date"
                value={hasta}
                min={desde}
                onChange={e => setHasta(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="consumo-stats">

          <div className="consumo-stat principal">
            <div className="consumo-stat-icon">
              <Wallet size={23} />
            </div>

            <div>
              <span>Total del período</span>
              <strong>L {total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="consumo-stat">
            <div className="consumo-stat-icon">
              <ReceiptText size={23} />
            </div>

            <div>
              <span>Pedidos</span>
              <strong>{rows.length}</strong>
            </div>
          </div>

          <div className="consumo-stat">
            <div className="consumo-stat-icon">
              <ShoppingBag size={23} />
            </div>

            <div>
              <span>Productos</span>
              <strong>{cantidadProductos}</strong>
            </div>
          </div>

        </div>

        <div className="consumo-history">
          <div className="history-title">
            <div>
              <h2>Detalle de consumo</h2>
              <p>
                {textoRango(desde, hasta)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-history">
              Cargando consumo...
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-history">
              <ReceiptText size={36} />

              <strong>
                No tienes consumo en este período
              </strong>

              <span>
                Los pedidos que realices aparecerán aquí.
              </span>
            </div>
          ) : (
            <div className="history-list">

              {rows.map(p => {
                const pedidoTotal =
                  (p.detalle_pedido || []).reduce(
                    (s, d) =>
                      s +
                      Number(d.cantidad) *
                        Number(d.precio_unitario),
                    0
                  )

                const fecha = fechaDesdeISO(p.fecha)

                return (
                  <div
                    className="history-card"
                    key={p.id}
                  >
                    <div className="history-date">
                      <span>
                        {DIAS[
                          fecha.getDay()
                        ].toUpperCase()}
                      </span>

                      <strong>
                        {fecha.getDate()}
                      </strong>

                      <small>
                        {MESES[
                          fecha.getMonth()
                        ].slice(0, 3).toUpperCase()}
                      </small>
                    </div>

                    <div className="history-content">
                      <div className="history-full-date">
                        {fechaLarga(p.fecha)}
                      </div>

                      {(p.detalle_pedido || []).map(
                        (d, index) => (
                          <div
                            className="history-product"
                            key={index}
                          >
                            <div>
                              <strong>
                                {d.productos?.nombre ||
                                  'Producto'}
                              </strong>

                              <span>
                                {d.cantidad} × L{' '}
                                {Number(
                                  d.precio_unitario
                                ).toFixed(2)}
                              </span>
                            </div>

                            <strong>
                              L{' '}
                              {(
                                Number(d.cantidad) *
                                Number(
                                  d.precio_unitario
                                )
                              ).toFixed(2)}
                            </strong>
                          </div>
                        )
                      )}
                    </div>

                    <div className="history-total">
                      <span>Total</span>
                      <strong>
                        L {pedidoTotal.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )
              })}

            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}