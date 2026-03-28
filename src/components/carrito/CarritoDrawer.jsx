import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCarritoStore } from '../../store/carritoStore'
import { formatPrecio } from '../../lib/format'
import { useNavigate, useParams } from 'react-router-dom'

export const CarritoDrawer = ({ open, onClose }) => {
  const { slug } = useParams()
  const items       = useCarritoStore(s => s.items)
  // FIX: llamar como función, no como propiedad
  const total       = useCarritoStore(s => s.total())
  const quitar      = useCarritoStore(s => s.quitar)
  const setCantidad = useCarritoStore(s => s.setCantidad)
  const vaciar      = useCarritoStore(s => s.vaciar)
  const navigate    = useNavigate()

  const handleCheckout = () => {
    onClose()
    navigate(`/tienda/${slug}/checkout`)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={`fixed right-0 top-0 h-full z-50 w-full max-w-sm bg-white shadow-2xl
                       flex flex-col transition-transform duration-300
                       ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-gray-700" />
            <h2 className="font-semibold text-gray-800">Carrito</h2>
            {items.length > 0 && (
              <span className="badge badge-blue">{items.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={vaciar}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Vaciar
              </button>
            )}
            <button onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-gray-500 text-sm">El carrito está vacío</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.idProductoLocal}
                   className="flex gap-3 p-3 bg-gray-50 rounded-xl items-start">
                {item.imagenUrl ? (
                  <img src={item.imagenUrl} alt={item.nombre}
                       className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center
                                  justify-center text-2xl flex-shrink-0">📦</div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrecio(item.precio)} c/u
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCantidad(item.idProductoLocal, item.cantidad - 1)}
                              className="w-6 h-6 rounded-full bg-white border border-gray-200
                                         flex items-center justify-center hover:bg-gray-100">
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {item.cantidad}
                      </span>
                      <button onClick={() => setCantidad(item.idProductoLocal, item.cantidad + 1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center
                                         text-white"
                              style={{ backgroundColor: 'var(--color-acento)' }}>
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrecio(Number(item.precio) * Number(item.cantidad))}
                      </span>
                      <button onClick={() => quitar(item.idProductoLocal)}
                              className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">{formatPrecio(total)}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              El costo de envío se calcula en el checkout
            </p>
            <button onClick={handleCheckout} className="btn-primary w-full text-center py-3">
              Ir al checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
