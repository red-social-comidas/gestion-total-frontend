import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye, MapPin, Store, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getPedidos, getPedido } from '../../api/dashboard'
import { formatPrecio, formatFecha } from '../../lib/format'
import { Spinner } from '../../components/ui/Spinner'
import { Modal } from '../../components/ui/Modal'

const ESTADOS_CONFIG = {
  por_confirmar:  { label: 'Por confirmar',  color: 'badge-yellow',   icon: Clock         },
  en_preparacion: { label: 'En preparación', color: 'badge-blue',     icon: Clock         },
  para_entregar:  { label: 'Para entregar',  color: 'badge-purple',   icon: Clock         },
  entregado:      { label: 'Entregado',      color: 'badge-green',    icon: CheckCircle   },
  cancelado:      { label: 'Cancelado',      color: 'badge-red',      icon: XCircle       },
}

export default function ReportesPage() {
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda,     setBusqueda]     = useState('')
  const [pedidoDetalle, setPedidoDetalle] = useState(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['dashboard', 'reportes', filtroEstado],
    queryFn: () => getPedidos(filtroEstado || undefined),
    staleTime: 30000,
  })

  const filtrados = pedidos.filter(p => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      p.numero_pedido?.toLowerCase().includes(q) ||
      p.cliente_nombre?.toLowerCase().includes(q) ||
      p.cliente_celular?.includes(q)
    )
  })

  const abrirDetalle = async (id) => {
    setLoadingDetalle(true)
    try {
      const data = await getPedido(id)
      setPedidoDetalle(data)
    } catch {
      /* si falla mostrar lo que tenemos */
      setPedidoDetalle(pedidos.find(p => p.id === id))
    } finally {
      setLoadingDetalle(false)
    }
  }

  // Estadísticas rápidas
  const stats = {
    total:      pedidos.length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
    cancelados: pedidos.filter(p => p.estado === 'cancelado').length,
    domicilio:  pedidos.filter(p => p.metodo_entrega === 'domicilio').length,
    totalPesos: pedidos.filter(p => p.estado === 'entregado')
                       .reduce((acc, p) => acc + Number(p.total), 0),
  }

  return (
    <div className="px-5 py-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Reportes de pedidos</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total pedidos', val: stats.total,      color: 'bg-blue-50   text-blue-700' },
          { label: 'Entregados',    val: stats.entregados,  color: 'bg-green-50  text-green-700' },
          { label: 'Cancelados',   val: stats.cancelados,  color: 'bg-red-50    text-red-600'   },
          { label: 'Total Pedidos', val: formatPrecio(stats.totalPesos), color: 'bg-purple-50 text-purple-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${color} rounded-2xl p-4`}>
            <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
            <p className="text-xl font-bold">{val}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por N° pedido, nombre o celular..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_CONFIG).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['N° Pedido', 'Cliente', 'Entrega', 'Estado', 'Total', 'Fecha', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(p => {
                  const est = ESTADOS_CONFIG[p.estado] || {}
                  const Icon = est.icon || Clock
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-800">{p.numero_pedido}</span>
                        {p.origen === 'dashboard_manual' && (
                          <span className="ml-1.5 badge badge-gray text-xs">manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700">{p.cliente_nombre}</p>
                        <p className="text-xs text-gray-400">{p.cliente_celular}</p>
                      </td>
                      <td className="px-4 py-3">
                        {p.metodo_entrega === 'domicilio' ? (
                          <span className="flex items-center gap-1 text-purple-600 text-xs font-medium">
                            <MapPin size={11} /> Domicilio
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                            <Store size={11} /> Retiro
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${est.color || 'badge-gray'} gap-1`}>
                          <Icon size={10} /> {est.label || p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">{formatPrecio(p.total)}</span>
                        {p.costo_envio > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            (inc. envío {formatPrecio(p.costo_envio)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatFecha(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => abrirDetalle(p.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100
                                     rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtrados.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm">Sin pedidos para mostrar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal detalle */}
      <Modal
        open={!!pedidoDetalle}
        onClose={() => setPedidoDetalle(null)}
        title={`Detalle — ${pedidoDetalle?.numero_pedido || ''}`}
        size="lg"
      >
        {loadingDetalle ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : pedidoDetalle ? (
          <div className="space-y-5 text-sm">
            {/* Info cliente */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['Cliente',    pedidoDetalle.cliente_nombre],
                ['Celular',    pedidoDetalle.cliente_celular],
                ['DNI/CUIT',   pedidoDetalle.cliente_documento || '—'],
                ['Email',      pedidoDetalle.cliente_email || '—'],
                ['Entrega',    pedidoDetalle.metodo_entrega === 'domicilio'
                                 ? `🚚 Domicilio${pedidoDetalle.direccion_entrega ? ` — ${pedidoDetalle.direccion_entrega}` : ''}`
                                 : '🏪 Retiro en local'],
                ['Origen',     pedidoDetalle.origen],
                ['Estado',     ESTADOS_CONFIG[pedidoDetalle.estado]?.label || pedidoDetalle.estado],
                ['Fecha',      formatFecha(pedidoDetalle.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {/* Productos */}
            {pedidoDetalle.items?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 mb-2">Productos</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Código</th>
                        <th className="px-3 py-2 text-left text-xs text-gray-500">Descripción</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">Precio u.</th>
                        <th className="px-3 py-2 text-right text-xs text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedidoDetalle.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-xs text-gray-500">{item.codigo_barras}</td>
                          <td className="px-3 py-2 text-gray-800">{item.nombre_producto}</td>
                          <td className="px-3 py-2 text-right font-medium">{item.cantidad}</td>
                          <td className="px-3 py-2 text-right">{formatPrecio(item.precio_unitario)}</td>
                          <td className="px-3 py-2 text-right font-bold">
                            {formatPrecio(item.precio_unitario * item.cantidad)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totales */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrecio(pedidoDetalle.subtotal)}</span>
              </div>
              {Number(pedidoDetalle.costo_envio) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Costo envío</span>
                  <span>{formatPrecio(pedidoDetalle.costo_envio)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                <span>TOTAL</span>
                <span>{formatPrecio(pedidoDetalle.total)}</span>
              </div>
            </div>

            {pedidoDetalle.notas && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-800 text-sm">
                📝 {pedidoDetalle.notas}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
