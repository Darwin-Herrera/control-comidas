import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../services/supabase'

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargarDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id, fecha, usuario_id, estado')
        .order('fecha', { ascending: false })
        .limit(500)

      if (pedidosError) throw pedidosError

      const ids = (pedidosData || []).map(p => p.id)

      let detalles = []

      if (ids.length > 0) {
        const { data: detallesData, error: detallesError } = await supabase
          .from('detalle_pedido')
          .select('id, pedido_id, cantidad, precio_unitario')
          .in('pedido_id', ids)

        if (detallesError) throw detallesError
        detalles = detallesData || []
      }

      const resultado = (pedidosData || []).map(p => ({
        ...p,
        detalles: detalles.filter(d => d.pedido_id === p.id)
      }))

      setPedidos(resultado)
    } catch (err) {
      console.error('Error Dashboard:', err)
      setError(err.message || 'No se pudo cargar el Dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDashboard()
  }, [])

  // Evitamos problemas de UTC con toISOString()
  const ahora = new Date()

  const hoy =
    ahora.getFullYear() +
    '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(ahora.getDate()).padStart(2, '0')

  const inicioMes =
    ahora.getFullYear() +
    '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') +
    '-01'

  const ultimoDia = new Date(
    ahora.getFullYear(),
    ahora.getMonth() + 1,
    0
  ).getDate()

  const finMes =
    ahora.getFullYear() +
    '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(ultimoDia).padStart(2, '0')

  const inicioQuincena =
    ahora.getDate() <= 15
      ? inicioMes
      : `${ahora.getFullYear()}-${String(
          ahora.getMonth() + 1
        ).padStart(2, '0')}-16`

  const finQuincena =
    ahora.getDate() <= 15
      ? `${ahora.getFullYear()}-${String(
          ahora.getMonth() + 1
        ).padStart(2, '0')}-15`
      : finMes

  const totalPedido = pedido =>
    (pedido.detalles || []).reduce(
      (suma, d) =>
        suma + Number(d.cantidad || 0) * Number(d.precio_unitario || 0),
      0
    )

  const pedidosHoy = pedidos.filter(p => p.fecha === hoy)

  const pedidosQuincena = pedidos.filter(
    p => p.fecha >= inicioQuincena && p.fecha <= finQuincena
  )

  const pedidosMes = pedidos.filter(
    p => p.fecha >= inicioMes && p.fecha <= finMes
  )

  const sumar = lista =>
    lista.reduce((suma, pedido) => suma + totalPedido(pedido), 0)

  return (
    <Layout>
      <div className="page">
        <h1>Dashboard</h1>
        <p className="muted">Resumen operativo del local.</p>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {loading ? (
          <p>Cargando información...</p>
        ) : (
          <div className="stats-grid">

            <div className="stat-card">
              <span>Pedidos de hoy</span>
              <strong>{pedidosHoy.length}</strong>
            </div>

            <div className="stat-card">
              <span>Venta de hoy</span>
              <strong>L {sumar(pedidosHoy).toFixed(2)}</strong>
            </div>

            <div className="stat-card">
              <span>Quincena actual</span>
              <strong>L {sumar(pedidosQuincena).toFixed(2)}</strong>
            </div>

            <div className="stat-card">
              <span>Mes actual</span>
              <strong>L {sumar(pedidosMes).toFixed(2)}</strong>
            </div>

          </div>
        )}
      </div>
    </Layout>
  )
}