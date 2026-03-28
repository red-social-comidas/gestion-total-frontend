/**
 * useEscanerCamara
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook reutilizable para escanear códigos de barras usando la cámara del
 * dispositivo (móvil, tablet, desktop con webcam).
 *
 * Usa @zxing/browser que soporta la mayoría de formatos industriales:
 * EAN-13, EAN-8, Code-128, Code-39, QR, DataMatrix, ITF, UPC-A, UPC-E, etc.
 *
 * Uso:
 *   const { abrirEscaner, EscanerModal } = useEscanerCamara({
 *     onResult: (codigo) => setBusqueda(codigo),
 *   })
 *
 *   return (
 *     <>
 *       <button onClick={abrirEscaner}>📷</button>
 *       <EscanerModal />
 *     </>
 *   )
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react'

// ── Carga dinámica de zxing para no bloquear el bundle inicial ────────────
let BrowserMultiFormatReader = null
const cargarZxing = async () => {
  if (BrowserMultiFormatReader) return BrowserMultiFormatReader
  try {
    const mod = await import('@zxing/browser')
    BrowserMultiFormatReader = mod.BrowserMultiFormatReader
    return BrowserMultiFormatReader
  } catch {
    return null
  }
}

export const useEscanerCamara = ({ onResult }) => {
  const [abierto,       setAbierto]       = useState(false)
  const [escaneando,    setEscaneando]    = useState(false)
  const [error,         setError]         = useState(null)
  const [camaras,       setCamaras]       = useState([])
  const [camaraActiva,  setCamaraActiva]  = useState(null) // deviceId
  const [resultado,     setResultado]     = useState(null)

  const videoRef    = useRef(null)
  const readerRef   = useRef(null)
  const controleRef = useRef(null) // para detener el stream

  // Limpiar al desmontar
  useEffect(() => {
    return () => detenerEscaneo()
  }, [])

  const detenerEscaneo = useCallback(() => {
    try {
      if (controleRef.current) {
        controleRef.current.stop()
        controleRef.current = null
      }
      if (readerRef.current) {
        readerRef.current.reset()
      }
    } catch (_) {}
    setEscaneando(false)
  }, [])

  const iniciarEscaneo = useCallback(async (deviceId) => {
    setError(null)
    setResultado(null)
    setEscaneando(true)

    try {
      const ZxingReader = await cargarZxing()
      if (!ZxingReader) {
        setError('No se pudo cargar el lector de códigos de barras.')
        setEscaneando(false)
        return
      }

      readerRef.current = new ZxingReader()

      // Si no hay deviceId elegido, tomar la cámara trasera por defecto
      const targetDeviceId = deviceId || camaraActiva

      controleRef.current = await readerRef.current.decodeFromVideoDevice(
        targetDeviceId || undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const codigo = result.getText()
            setResultado(codigo)
            detenerEscaneo()
            setAbierto(false)
            onResult(codigo)
          }
          // Ignorar errores de "no encontrado aún" — son normales durante el escaneo
        }
      )
    } catch (err) {
      console.error('[EscanerCamara] Error:', err)
      if (err?.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Habilitá el acceso a la cámara en el navegador.')
      } else if (err?.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.')
      } else {
        setError('No se pudo acceder a la cámara. Intentá recargar la página.')
      }
      setEscaneando(false)
    }
  }, [camaraActiva, detenerEscaneo, onResult])

  const listarCamaras = useCallback(async () => {
    try {
      const ZxingReader = await cargarZxing()
      if (!ZxingReader) return []
      const devices = await ZxingReader.listVideoInputDevices()
      return devices
    } catch {
      return []
    }
  }, [])

  const abrirEscaner = useCallback(async () => {
    setAbierto(true)
    setError(null)
    setResultado(null)

    // Listar cámaras disponibles
    const devices = await listarCamaras()
    setCamaras(devices)

    // Preferir cámara trasera en móviles
    const trasera = devices.find(d =>
      d.label.toLowerCase().includes('back') ||
      d.label.toLowerCase().includes('rear') ||
      d.label.toLowerCase().includes('trasera') ||
      d.label.toLowerCase().includes('environment')
    )
    const deviceId = trasera?.deviceId || devices[0]?.deviceId || null
    setCamaraActiva(deviceId)

    // Pequeño delay para que el video element esté montado
    setTimeout(() => iniciarEscaneo(deviceId), 300)
  }, [iniciarEscaneo, listarCamaras])

  const cerrar = useCallback(() => {
    detenerEscaneo()
    setAbierto(false)
    setError(null)
    setResultado(null)
  }, [detenerEscaneo])

  const cambiarCamara = useCallback(async (deviceId) => {
    detenerEscaneo()
    setCamaraActiva(deviceId)
    setTimeout(() => iniciarEscaneo(deviceId), 200)
  }, [detenerEscaneo, iniciarEscaneo])

  // ── Modal del escáner ─────────────────────────────────────────────────────
  const EscanerModal = useCallback(() => {
    if (!abierto) return null

    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={cerrar} />

        {/* Panel */}
        <div className="relative w-full sm:max-w-md bg-gray-900 rounded-t-3xl sm:rounded-2xl
                        shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-green-400" />
              <h3 className="font-semibold text-white text-sm">Escanear código de barras</h3>
            </div>
            <button onClick={cerrar}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Área de video */}
          <div className="relative bg-black" style={{ minHeight: 260 }}>
            <video
              ref={videoRef}
              className="w-full object-cover"
              style={{ height: 260 }}
              autoPlay
              muted
              playsInline
            />

            {/* Marco de escaneo */}
            {escaneando && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-56 h-40">
                  {/* Esquinas del marco */}
                  {[
                    'top-0 left-0 border-t-2 border-l-2',
                    'top-0 right-0 border-t-2 border-r-2',
                    'bottom-0 left-0 border-b-2 border-l-2',
                    'bottom-0 right-0 border-b-2 border-r-2',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-green-400 ${cls}`} />
                  ))}
                  {/* Línea de escaneo animada */}
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400/70"
                       style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
                </div>
              </div>
            )}

            {/* Estado: iniciando */}
            {!escaneando && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent
                                  rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-300">Iniciando cámara...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                <div className="text-center">
                  <CameraOff size={36} className="text-red-400 mx-auto mb-3" />
                  <p className="text-white text-sm font-medium mb-1">Error de cámara</p>
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed">{error}</p>
                  <button
                    onClick={() => iniciarEscaneo(camaraActiva)}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-green-500
                               hover:bg-green-600 text-white text-sm rounded-xl transition-colors"
                  >
                    <RefreshCw size={14} /> Reintentar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer con instrucciones y selector de cámara */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-gray-400 text-xs text-center">
              Apuntá la cámara al código de barras del producto.
              Se detecta automáticamente.
            </p>

            {/* Selector de cámara si hay más de una */}
            {camaras.length > 1 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cambiar cámara:</label>
                <select
                  value={camaraActiva || ''}
                  onChange={e => cambiarCamara(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-200 text-xs
                             rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
                >
                  {camaras.map(cam => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label || `Cámara ${cam.deviceId.substring(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button onClick={cerrar}
                    className="w-full py-2.5 rounded-xl bg-gray-700 text-gray-300
                               hover:bg-gray-600 transition-colors text-sm">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }, [abierto, escaneando, error, camaras, camaraActiva, cerrar, cambiarCamara, iniciarEscaneo])

  return { abrirEscaner, cerrar, EscanerModal }
}
