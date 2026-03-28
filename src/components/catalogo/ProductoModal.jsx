import { useState } from 'react'
import { X, ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCarritoStore } from '../../store/carritoStore'
import { StockBadge } from './StockBadge'
import { formatPrecio } from '../../lib/format'
import toast from 'react-hot-toast'

export const ProductoModal = ({ producto, open, onClose }) => {
  const [cantidad, setCantidad] = useState(1)
  const agregar  = useCarritoStore(s => s.agregar)

  if (!open || !producto) return null

  const sinStock = producto.stock_badge === 'sin_stock'

  const handleAgregar = () => {
    if (sinStock) return
    agregar(producto, cantidad)
    toast.success(
      <span>
        <strong>{cantidad}×</strong> {producto.nombre.substring(0, 30)}{producto.nombre.length > 30 ? '...' : ''}
        {' '}agregado al carrito 🛒
      </span>,
      { duration: 2000 }
    )
    setCantidad(1)
    onClose()
  }

  const inc = () => setCantidad(c => c + 1)
  const dec = () => setCantidad(c => Math.max(1, c - 1))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl
                      shadow-2xl animate-slide-up overflow-hidden">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200
                     rounded-full flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-gray-600" />
        </button>

        {/* Imagen */}
        <div className="bg-gray-50 aspect-video sm:aspect-square sm:max-h-60 overflow-hidden
                        flex items-center justify-center">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-7xl text-gray-200">📦</div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Badge stock */}
          {producto.stock_badge && (
            <StockBadge badge={producto.stock_badge} />
          )}

          {/* Nombre */}
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            {producto.nombre}
          </h2>

          {/* Precio + unidad */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">
              {formatPrecio(producto.precio)}
            </span>
            <span className="text-sm text-gray-400">/ Unidad</span>
          </div>

          {/* Descripción web si existe */}
          {producto.descripcion_web && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {producto.descripcion_web}
            </p>
          )}

          {/* Selector de cantidad */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Cantidad</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <button
                onClick={dec}
                disabled={cantidad <= 1}
                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center
                           text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold text-gray-900 text-lg">
                {cantidad}
              </span>
              <button
                onClick={inc}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           text-white transition-colors"
                style={{ backgroundColor: 'var(--color-acento)' }}
              >
                <Plus size={14} />
              </button>
            </div>
            {/* Subtotal dinámico */}
            <span className="text-sm font-semibold text-gray-600 ml-auto">
              = {formatPrecio(producto.precio * cantidad)}
            </span>
          </div>

          {/* Botón agregar */}
          <button
            onClick={handleAgregar}
            disabled={sinStock}
            className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center
                        justify-center gap-2 transition-all active:scale-95
                        ${sinStock
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'text-white shadow-md hover:opacity-90'
                        }`}
            style={sinStock ? {} : { backgroundColor: 'var(--color-acento)' }}
          >
            <ShoppingCart size={18} />
            {sinStock ? 'Sin stock' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
