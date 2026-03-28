import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Store, Phone, Clock, AlertTriangle, Edit2 } from 'lucide-react'
import { EditarPedidoModal } from './EditarPedidoModal'
import { formatPrecio, formatAntiguedad } from '../../lib/format'

const TRANSICIONES = {
  por_confirmar:  [{ estado: 'en_preparacion', label: '▶ En preparación' }, { estado: 'cancelado', label: '✕ Cancelar' }],
  en_preparacion: [{ estado: 'para_entregar',  label: '▶ Para entregar'  }, { estado: 'cancelado', label: '✕ Cancelar' }],
  para_entregar:  [{ estado: 'entregado',       label: '✓ Entregado'     }, { estado: 'cancelado', label: '✕ Cancelar' }],
  entregado:      [],
  cancelado:      [],
}

export const KanbanCard = ({ pedido, onCambiarEstado, compacto = false }) => {
  const [expandido,    setExpandido]    = useState(false)
  const [editarOpen,   setEditarOpen]   = useState(false)

  const antiguedad  = formatAntiguedad(pedido.created_at)
  const esDomicilio = pedido.metodo_entrega === 'domicilio'
  const transiciones = TRANSICIONES[pedido.estado] || []

  // Compacto para columna "entregado"
  if (compacto) {
    return (
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">{pedido.numero_pedido}</span>
          <span className="text-gray-400 text-xs">{antiguedad}</span>
        </div>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{pedido.cliente_nombre}</p>
        <p className="text-gray-900 font-bold">{formatPrecio(pedido.total)}</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
                      transition-shadow hover:shadow-md animate-fade-in">
        {/* Header — click para expandir */}
        <div className="p-3.5 cursor-pointer" onClick={() => setExpandido(e => !e)}>
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-xs font-bold text-gray-500 tracking-wide">{pedido.numero_pedido}</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={10} />{antiguedad}
            </div>
          </div>

          <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
            {pedido.cliente_nombre}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              {esDomicilio
                ? <><MapPin size={11} className="text-purple-400" />Domicilio</>
                : <><Store  size={11} className="text-blue-400"   />Retiro</>
              }
            </span>
            <span className="text-base font-bold text-gray-900">{formatPrecio(pedido.total)}</span>
          </div>

          <div className="flex justify-center mt-2">
            {expandido ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
          </div>
        </div>

        {/* Detalle expandido */}
        {expandido && (
          <div className="border-t border-gray-100 p-3.5 space-y-3 animate-fade-in bg-gray-50/50">
            {/* Contacto */}
            <div className="space-y-1">
              {pedido.cliente_celular && (
                <a href={`tel:${pedido.cliente_celular}`}
                   className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600">
                  <Phone size={11} /> {pedido.cliente_celular}
                </a>
              )}
              {pedido.cliente_documento && (
                <p className="text-xs text-gray-500">DNI: {pedido.cliente_documento}</p>
              )}
              {esDomicilio && pedido.direccion_entrega && (
                <p className="text-xs text-gray-600 flex items-start gap-1">
                  <MapPin size={11} className="mt-0.5 flex-shrink-0 text-purple-400" />
                  {pedido.direccion_entrega}
                </p>
              )}
            </div>

            {/* Items */}
            {pedido.items?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</p>
                {pedido.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-xs text-gray-600 gap-1">
                    <span className="flex-1 leading-tight">
                      <span className="font-medium">{item.cantidad}×</span> {item.nombre_producto}
                      {item.codigo_barras && (
                        <span className="text-gray-400 ml-1">[{item.codigo_barras}]</span>
                      )}
                    </span>
                    <span className="font-medium flex-shrink-0">
                      {formatPrecio(Number(item.precio_unitario) * Number(item.cantidad))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Totales */}
            <div className="border-t border-gray-200 pt-2 space-y-1">
              {Number(pedido.costo_envio) > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Envío</span><span>{formatPrecio(pedido.costo_envio)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Total</span><span>{formatPrecio(pedido.total)}</span>
              </div>
            </div>

            {pedido.notas && (
              <div className="bg-yellow-50 rounded-lg p-2 text-xs text-yellow-800
                              flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                {pedido.notas}
              </div>
            )}

            {/* Acciones: Editar + transiciones */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {/* Botón Editar — solo si no está en estados terminales */}
              {!['entregado', 'cancelado'].includes(pedido.estado) && (
                <button
                  onClick={() => setEditarOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs
                             font-medium bg-white border border-gray-200 text-gray-600
                             hover:bg-gray-50 transition-colors"
                >
                  <Edit2 size={11} /> Editar
                </button>
              )}
              {transiciones.map(({ estado, label }) => (
                <button
                  key={estado}
                  onClick={() => onCambiarEstado(estado)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                               text-white transition-all active:scale-95 min-w-0
                               ${estado === 'cancelado' ? 'bg-red-400 hover:bg-red-500' : 'hover:opacity-90'}`}
                  style={estado !== 'cancelado' ? { backgroundColor: 'var(--color-acento)' } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal editar */}
      <EditarPedidoModal
        pedido={pedido}
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
      />
    </>
  )
}
