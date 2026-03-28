import { Search, X } from 'lucide-react'
import { BotonEscaner } from '../ui/BarcodeScanner'

export const FiltrosCatalogo = ({
  categorias = [],
  categoriaActiva,
  onCategoria,
  busqueda,
  onBusqueda,
  soloMobile = false,
}) => (
  <div className="space-y-3">
    {/* Buscador con botón de cámara */}
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={e => onBusqueda(e.target.value)}
          className="input-field pl-9 pr-9 w-full"
        />
        {busqueda && (
          <button
            onClick={() => onBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Botón escáner de cámara */}
      <BotonEscaner
        onDetectado={(codigo) => onBusqueda(codigo)}
        title="Escanear código de barras"
      />
    </div>

    {/* Chips de categorías — mobile o siempre según prop */}
    {categorias.length > 0 && (
      <div className={`flex flex-wrap gap-2 ${soloMobile ? 'lg:hidden' : ''}`}>
        <button
          onClick={() => onCategoria(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${!categoriaActiva
              ? 'text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          style={!categoriaActiva ? { backgroundColor: 'var(--color-acento)' } : {}}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategoria(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${categoriaActiva === cat.id
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            style={categoriaActiva === cat.id ? { backgroundColor: 'var(--color-acento)' } : {}}
          >
            {cat.nombre}
          </button>
        ))}
      </div>
    )}
  </div>
)
