import { useState } from 'react'
import { ShoppingCart, Eye } from 'lucide-react'
import { useCarritoStore } from '../../store/carritoStore'
import { StockBadge } from './StockBadge'
import { ProductoModal } from './ProductoModal'
import { formatPrecio } from '../../lib/format'
import toast from 'react-hot-toast'

export const ProductoCard = ({ producto }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const agregar = useCarritoStore(s => s.agregar)
  const sinStock = producto.stock_badge === 'sin_stock'

  const handleAgregarRapido = (e) => {
    e.stopPropagation()
    if (sinStock) return
    agregar(producto, 1)
    toast.success(`Agregado al carrito`, { duration: 1500, icon: '🛒' })
  }

  return (
    <>
      {/* Card — click abre modal */}
      <div
        className="card group flex flex-col h-full overflow-hidden cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        {/* Imagen */}
        <div className="relative bg-gray-50 aspect-square overflow-hidden">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">
              📦
            </div>
          )}
          {producto.stock_badge && (
            <div className="absolute top-2 left-2">
              <StockBadge badge={producto.stock_badge} />
            </div>
          )}
          {/* Overlay "ver detalle" */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10
                          transition-all flex items-center justify-center opacity-0
                          group-hover:opacity-100">
            <span className="bg-white/90 text-gray-700 text-xs font-semibold
                             px-3 py-1.5 rounded-full shadow flex items-center gap-1">
              <Eye size={12} /> Ver detalle
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-acento
                        transition-colors leading-tight mb-1 flex-1">
            {producto.nombre}
          </p>

          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-base font-bold text-gray-900">
              {formatPrecio(producto.precio)}
            </span>

            <button
              onClick={handleAgregarRapido}
              disabled={sinStock}
              className={`p-2 rounded-xl transition-all active:scale-90
                ${sinStock
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'text-white hover:opacity-90 shadow-sm'
                }`}
              style={sinStock ? {} : { backgroundColor: 'var(--color-acento)' }}
              title={sinStock ? 'Sin stock' : 'Agregar al carrito'}
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal detalle */}
      <ProductoModal
        producto={producto}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
