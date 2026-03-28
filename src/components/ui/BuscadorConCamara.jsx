/**
 * BuscadorConCamara
 * ─────────────────────────────────────────────────────────────────────────────
 * Input de búsqueda con botón integrado que abre la cámara para escanear
 * códigos de barras. Reutilizable en todos los buscadores del sistema.
 *
 * Props:
 *   value         — valor actual del input (controlled)
 *   onChange      — callback (string) => void
 *   onKeyDown     — callback de teclado opcional (para Enter en código barras)
 *   placeholder   — texto placeholder
 *   autoFocus     — boolean
 *   className     — clases extra para el wrapper
 *   inputRef      — ref externo opcional para el input
 *
 * Uso:
 *   <BuscadorConCamara
 *     value={busqueda}
 *     onChange={setBusqueda}
 *     placeholder="Buscar por nombre o código..."
 *   />
 */
import { useRef } from 'react'
import { Search, X, Camera } from 'lucide-react'
import { useEscanerCamara } from '../../hooks/useEscanerCamara.jsx'

export const BuscadorConCamara = ({
  value,
  onChange,
  onKeyDown,
  placeholder = 'Buscar...',
  autoFocus = false,
  className = '',
  inputRef: externalRef = null,
}) => {
  const internalRef = useRef(null)
  const ref = externalRef || internalRef

  const { abrirEscaner, EscanerModal } = useEscanerCamara({
    onResult: (codigo) => {
      // Cuando el escáner detecta un código, lo pone en el input
      onChange(codigo)
      // Pequeño delay para que el modal cierre antes de enfocar el input
      setTimeout(() => ref.current?.focus(), 150)
    },
  })

  return (
    <>
      <div className={`relative flex items-center gap-2 ${className}`}>
        {/* Input con ícono de lupa */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="input-field pl-9 pr-8 w-full"
          />
          {/* Botón limpiar — visible solo cuando hay texto */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); ref.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                         hover:text-gray-600 transition-colors"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Botón cámara */}
        <button
          type="button"
          onClick={abrirEscaner}
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl
                     border border-gray-200 bg-white text-gray-500
                     hover:border-green-400 hover:text-green-600 hover:bg-green-50
                     transition-all active:scale-95"
          title="Escanear código de barras con la cámara"
        >
          <Camera size={18} />
        </button>
      </div>

      {/* Modal del escáner — se renderiza fuera del flujo normal */}
      <EscanerModal />
    </>
  )
}
