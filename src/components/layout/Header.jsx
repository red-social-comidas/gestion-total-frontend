import { useState } from 'react'
import { ShoppingCart, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCarritoStore } from '../../store/carritoStore'
import { CarritoDrawer } from '../carrito/CarritoDrawer'
import { calcularEstadoTienda } from '../../lib/format'

export const Header = ({ infoTienda }) => {
  const { slug } = useParams()
  const [carritoOpen, setCarritoOpen] = useState(false)
  // FIX: cantidadItems como función
  const cantidadItems = useCarritoStore(s => s.cantidadItems())

  const config  = infoTienda?.config_visual || {}
  const nombre  = infoTienda?.nombre_comercial || 'Tienda'
  const logoUrl = config.logo_url
  const abierto = calcularEstadoTienda(config)

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo / Nombre */}
          <Link to={`/tienda/${slug}`} className="flex items-center gap-2 group">
            {logoUrl ? (
              <img src={logoUrl} alt={nombre} className="h-9 w-auto object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                   style={{ backgroundColor: 'var(--color-acento)' }}>
                <Store size={18} />
              </div>
            )}
            <span className="font-bold text-gray-800 text-base group-hover:text-acento
                             transition-colors hidden sm:block">
              {nombre}
            </span>

            {abierto !== null && (
              <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5
                                rounded-full text-xs font-semibold
                                ${abierto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${abierto ? 'bg-green-500' : 'bg-red-400'}`} />
                {abierto ? 'Abierto' : 'Cerrado'}
              </span>
            )}
          </Link>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {abierto !== null && (
              <span className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5
                                rounded-full text-xs font-semibold
                                ${abierto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${abierto ? 'bg-green-500' : 'bg-red-400'}`} />
                {abierto ? 'Abierto' : 'Cerrado'}
              </span>
            )}

            {/* Botón carrito con badge visible solo cuando hay items */}
            <button
              onClick={() => setCarritoOpen(true)}
              className={`relative p-2.5 rounded-xl transition-all active:scale-95
                          ${cantidadItems > 0 ? 'ring-2' : ''}`}
              style={{
                backgroundColor: cantidadItems > 0
                  ? 'var(--color-acento)'
                  : 'var(--color-acento-light, #e8f0fb)',
                ringColor: 'var(--color-acento)',
              }}
            >
              <ShoppingCart
                size={20}
                style={{ color: cantidadItems > 0 ? '#fff' : 'var(--color-acento)' }}
              />
              {cantidadItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1
                                 bg-red-500 text-white text-xs font-bold rounded-full
                                 flex items-center justify-center animate-bounce-soft">
                  {cantidadItems > 99 ? '99+' : cantidadItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <CarritoDrawer open={carritoOpen} onClose={() => setCarritoOpen(false)} />
    </>
  )
}
