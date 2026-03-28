import { useRef, useEffect } from 'react'
import { X, Scan, Flashlight, RefreshCw } from 'lucide-react'
import { useEscaner } from '../../hooks/useEscaner'

/**
 * Modal de escáner de código de barras.
 *
 * Props:
 *   open        {boolean}  — controla si el modal está visible
 *   onClose     {fn}       — se llama al cerrar sin resultado
 *   onDetectado {fn(str)}  — se llama con el código detectado
 *
 * Uso:
 *   <BarcodeScanner
 *     open={scannerOpen}
 *     onClose={() => setScannerOpen(false)}
 *     onDetectado={(codigo) => { setBusqueda(codigo); setScannerOpen(false) }}
 *   />
 */
export const BarcodeScanner = ({ open, onClose, onDetectado }) => {
  const videoRef = useRef(null)

  const handleDetectado = (codigo) => {
    onDetectado(codigo)
    onClose()
  }

  const { escanerActivo, iniciarEscaner, detenerEscaner, error } = useEscaner({
    onDetectado: handleDetectado,
  })

  // Arrancar la cámara cuando el modal se abre
  useEffect(() => {
    if (open && videoRef.current) {
      iniciarEscaner(videoRef.current)
    }
    return () => {
      if (!open) detenerEscaner()
    }
  }, [open])

  const handleClose = () => {
    detenerEscaner()
    onClose()
  }

  const handleReintentar = () => {
    detenerEscaner()
    setTimeout(() => {
      if (videoRef.current) iniciarEscaner(videoRef.current)
    }, 300)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-sm bg-gray-900 rounded-t-3xl sm:rounded-2xl
                      overflow-hidden shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Scan size={18} className="text-green-400" />
            <span className="text-white font-semibold text-sm">Escáner de código de barras</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20
                       text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Visor de cámara */}
        <div className="relative bg-black aspect-square sm:aspect-video overflow-hidden mx-4 mb-4 rounded-2xl">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />

          {/* Overlay de guía de escaneo */}
          {escanerActivo && !error && (
            <>
              {/* Esquinas del visor */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-56 h-36">
                  {/* Línea animada de escaneo */}
                  <div className="absolute inset-x-0 h-0.5 bg-green-400 opacity-80
                                  animate-[scan_2s_ease-in-out_infinite]
                                  shadow-[0_0_8px_2px_rgba(74,222,128,0.6)]"
                       style={{
                         animation: 'scanLine 2s ease-in-out infinite',
                       }}
                  />
                  {/* Esquinas */}
                  {[
                    'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                    'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                    'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                    'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-green-400 ${cls}`} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Estado: cargando */}
          {!escanerActivo && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center
                            bg-gray-900/80 gap-3">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent
                              rounded-full animate-spin" />
              <p className="text-white text-sm">Iniciando cámara...</p>
            </div>
          )}

          {/* Estado: error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center
                            bg-gray-900 gap-4 px-6 text-center">
              <div className="text-4xl">📷</div>
              <p className="text-white text-sm leading-relaxed">{error}</p>
              <button
                onClick={handleReintentar}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white
                           rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        {escanerActivo && !error && (
          <p className="text-center text-gray-400 text-xs pb-5 px-4">
            Apuntá la cámara al código de barras del producto.
            Se detecta automáticamente.
          </p>
        )}
      </div>

      {/* Animación de la línea de escaneo */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  )
}

/**
 * Botón pequeño de cámara para colocar al lado de un input.
 * Al hacer click abre el BarcodeScanner.
 *
 * Uso:
 *   <BotonEscaner onDetectado={(codigo) => setBusqueda(codigo)} />
 */
export const BotonEscaner = ({ onDetectado, className = '' }) => {
  const [open, setOpen] = useState(false)
  // useState se importa en el componente padre — necesitamos importarlo aquí
  // Lo hacemos inline con un pequeño wrapper
  return <BotonEscanerInner onDetectado={onDetectado} className={className} />
}

// Componente real con useState propio
import { useState } from 'react'

const BotonEscanerInner = ({ onDetectado, className = '' }) => {
  const [open, setOpen] = useState(false)

  const handleDetectado = (codigo) => {
    setOpen(false)
    onDetectado(codigo)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Escanear código de barras con la cámara"
        className={`flex items-center justify-center w-10 h-10 rounded-xl border
                    border-gray-200 bg-white text-gray-500
                    hover:border-green-400 hover:text-green-600 hover:bg-green-50
                    active:scale-95 transition-all flex-shrink-0 ${className}`}
      >
        <Scan size={17} />
      </button>

      <BarcodeScanner
        open={open}
        onClose={() => setOpen(false)}
        onDetectado={handleDetectado}
      />
    </>
  )
}
