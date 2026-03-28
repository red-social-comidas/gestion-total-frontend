import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook que gestiona el ciclo de vida del escáner de código de barras.
 * Usa BarcodeDetector nativo (Chrome/Edge/Android) cuando está disponible.
 * Fallback: @zxing/browser para Firefox y Safari.
 *
 * @returns {Object} { escanerActivo, iniciarEscaner, detenerEscaner, error }
 *
 * Uso:
 *   const { escanerActivo, iniciarEscaner, detenerEscaner } = useEscaner({
 *     onDetectado: (codigo) => { ... },
 *   })
 */
export const useEscaner = ({ onDetectado }) => {
  const [escanerActivo, setEscanerActivo] = useState(false)
  const [error,         setError]         = useState(null)
  const [usandoFallback, setUsandoFallback] = useState(false)

  const streamRef     = useRef(null)
  const videoRef      = useRef(null)
  const readerRef     = useRef(null)
  const animFrameRef  = useRef(null)
  const deteniendoRef = useRef(false)

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => { limpiar() }
  }, [])

  const limpiar = useCallback(() => {
    deteniendoRef.current = true

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (readerRef.current) {
      try { readerRef.current.reset() } catch (_) {}
      readerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const iniciarEscaner = useCallback(async (videoElement) => {
    if (!videoElement) return
    videoRef.current = videoElement
    deteniendoRef.current = false
    setError(null)

    try {
      // Pedir acceso a la cámara trasera preferentemente
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      videoElement.srcObject = stream
      await videoElement.play()
      setEscanerActivo(true)

      // ── Intentar BarcodeDetector nativo primero ───────────────────────
      if ('BarcodeDetector' in window) {
        setUsandoFallback(false)
        const detector = new window.BarcodeDetector({
          formats: [
            'ean_13', 'ean_8', 'code_128', 'code_39',
            'upc_a', 'upc_e', 'itf', 'qr_code',
          ],
        })

        const detectar = async () => {
          if (deteniendoRef.current) return
          try {
            const barcodes = await detector.detect(videoElement)
            if (barcodes.length > 0 && !deteniendoRef.current) {
              const codigo = barcodes[0].rawValue
              limpiar()
              setEscanerActivo(false)
              onDetectado(codigo)
              return
            }
          } catch (_) {}
          if (!deteniendoRef.current) {
            animFrameRef.current = requestAnimationFrame(detectar)
          }
        }
        animFrameRef.current = requestAnimationFrame(detectar)

      } else {
        // ── Fallback: @zxing/browser ──────────────────────────────────
        setUsandoFallback(true)
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        reader.decodeFromVideoElement(videoElement, (result, err) => {
          if (deteniendoRef.current) return
          if (result) {
            const codigo = result.getText()
            limpiar()
            setEscanerActivo(false)
            onDetectado(codigo)
          }
          // err es normal cuando no hay código en el frame — no lo mostramos
        })
      }

    } catch (err) {
      setEscanerActivo(false)
      if (err.name === 'NotAllowedError') {
        setError('Permiso de cámara denegado. Habilitalo en la configuración del browser.')
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.')
      } else {
        setError(`Error al iniciar la cámara: ${err.message}`)
      }
    }
  }, [onDetectado, limpiar])

  const detenerEscaner = useCallback(() => {
    limpiar()
    setEscanerActivo(false)
    setError(null)
  }, [limpiar])

  return { escanerActivo, iniciarEscaner, detenerEscaner, error, usandoFallback }
}
