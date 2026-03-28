import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Store, AlertCircle, ChevronUp } from 'lucide-react'
import { useCarritoStore } from '../../store/carritoStore'
import { useInfoTienda } from '../../hooks/useTienda'
import { crearPedido } from '../../api/tienda'
import { formatPrecio } from '../../lib/format'
import { Header } from '../../components/layout/Header'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const items = useCarritoStore(s => s.items)
  const subtotal = useCarritoStore(s => s.total())
  const vaciar = useCarritoStore(s => s.vaciar)
  const { data: infoTienda } = useInfoTienda(slug)

  const config = infoTienda?.config_visual || {}

  // Estados del formulario
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteCelular, setClienteCelular] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteDocumento, setClienteDocumento] = useState('')
  const [metodoEntrega, setMetodoEntrega] = useState('retiro')
  const [direccionEntrega, setDireccionEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Refs para manejo de foco y scroll
  const refs = {
    cliente_nombre: useRef(null),
    cliente_celular: useRef(null),
    cliente_documento: useRef(null),
    direccion_entrega: useRef(null)
  }

  // 1. Efecto para foco inicial y detectar scroll para el botón "arriba"
  useEffect(() => {
    // Foco inicial en nombre (solo en desktop/tablet o si prefieres forzarlo en móvil)
    refs.cliente_nombre.current?.focus()

    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const costoEnvio = useMemo(() => {
    if (metodoEntrega !== 'domicilio') return 0
    const costo = Number(config.costo_envio_domicilio || 0)
    const gratisDesde = Number(config.envio_gratis_desde || 0)
    if (gratisDesde > 0 && subtotal >= gratisDesde) return 0
    return costo
  }, [metodoEntrega, subtotal, config])

  const total = subtotal + costoEnvio

  const limpiarError = (campo) =>
    setErrores(prev => { const n = { ...prev }; delete n[campo]; return n })

  // Función para scroll suave al primer error
  const scrollToError = (errors) => {
    const primerError = Object.keys(errors)[0]
    if (primerError && refs[primerError]?.current) {
      refs[primerError].current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      refs[primerError].current.focus()
    }
  }

  const validar = () => {
    const e = {}
    if (!clienteNombre.trim()) e.cliente_nombre = 'Nombre requerido'
    if (!clienteCelular.trim()) e.cliente_celular = 'Celular requerido'
    if (metodoEntrega === 'domicilio' && !direccionEntrega.trim())
      e.direccion_entrega = 'Dirección requerida para envío a domicilio'
    if (clienteDocumento && !/^\d{7,11}$/.test(clienteDocumento))
      e.cliente_documento = 'DNI debe ser entre 7 y 11 dígitos'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('El carrito está vacío'); return }
    
    const errs = validar()
    if (Object.keys(errs).length > 0) { 
      setErrores(errs)
      scrollToError(errs) // <--- Mejoramos la UX aquí
      return 
    }

    setEnviando(true)
    try {
      const pedido = await crearPedido(slug, {
        cliente_nombre: clienteNombre,
        cliente_celular: clienteCelular,
        cliente_email: clienteEmail || null,
        cliente_documento: clienteDocumento || null,
        metodo_entrega: metodoEntrega,
        direccion_entrega: direccionEntrega || null,
        notas: notas || null,
        items: items.map(i => ({
          id_producto_local: i.idProductoLocal,
          cantidad: i.cantidad,
        })),
      })
      vaciar()
      navigate(`/tienda/${slug}/confirmacion/${pedido.numero_pedido}`, {
        state: { formData: { cliente_nombre: clienteNombre, cliente_celular: clienteCelular, metodo_entrega: metodoEntrega, direccion_entrega: direccionEntrega, notas }, costoEnvio, totalPedido: total, itemsPedido: items, pedido }
      })
    } catch (err) {
      const msg = err.response?.data?.detail
      toast.error(typeof msg === 'string' ? msg : 'Error al enviar el pedido.')
    } finally {
      setEnviando(false)
    }
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header infoTienda={infoTienda} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Carrito vacío</h2>
          <Link to={`/tienda/${slug}`} className="btn-primary">Ver catálogo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20"> {/* Padding extra abajo para móviles */}
      <Header infoTienda={infoTienda} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to={`/tienda/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar pedido</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              
              {/* SECCIÓN 1: DATOS PERSONALES */}
              <div className="card p-5 space-y-4 border-t-4" style={{ borderTopColor: 'var(--color-acento)' }}>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                  <span className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-acento)' }}>1</span>
                  Tus datos personales
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                    <input
                      ref={refs.cliente_nombre}
                      type="text"
                      value={clienteNombre}
                      onChange={e => { setClienteNombre(e.target.value); limpiarError('cliente_nombre') }}
                      placeholder="Ej: Juan Pérez"
                      className={`input-field focus:ring-2 ${errores.cliente_nombre ? 'border-red-400 ring-red-100' : 'focus:ring-blue-100'}`}
                    />
                    {errores.cliente_nombre && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errores.cliente_nombre}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp *</label>
                    <input
                      ref={refs.cliente_celular}
                      type="tel"
                      value={clienteCelular}
                      onChange={e => { setClienteCelular(e.target.value); limpiarError('cliente_celular') }}
                      placeholder="Ej: 3624123456"
                      className={`input-field ${errores.cliente_celular ? 'border-red-400' : ''}`}
                    />
                    {errores.cliente_celular && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errores.cliente_celular}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={e => setClienteEmail(e.target.value)}
                      placeholder="tucorreo@gmail.com"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI / CUIT <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input
                      ref={refs.cliente_documento}
                      type="text"
                      value={clienteDocumento}
                      onChange={e => { setClienteDocumento(e.target.value); limpiarError('cliente_documento') }}
                      placeholder="Ej: 28456789"
                      className={`input-field ${errores.cliente_documento ? 'border-red-400' : ''}`}
                    />
                    {errores.cliente_documento && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errores.cliente_documento}</p>}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: ENTREGA */}
              <div className="card p-5 space-y-4 border-t-4" style={{ borderTopColor: 'var(--color-acento)' }}>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
                  <span className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-acento)' }}>2</span>
                  ¿Cómo quieres recibirlo?
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {config.acepta_retiro !== false && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${metodoEntrega === 'retiro' ? 'border-current' : 'border-gray-200'}`}
                           style={metodoEntrega === 'retiro' ? { borderColor: 'var(--color-acento)', backgroundColor: '#f0f7ff' } : {}}>
                      <input type="radio" value="retiro" checked={metodoEntrega === 'retiro'} onChange={() => setMetodoEntrega('retiro')} className="mt-1" />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-gray-800"><Store size={16} /> Retiro en local</div>
                        {config.direccion_local && <p className="text-xs text-gray-500 mt-1">{config.direccion_local}</p>}
                        <p className="text-xs text-green-600 font-bold mt-1 uppercase">Sin costo</p>
                      </div>
                    </label>
                  )}

                  {config.acepta_domicilio !== false && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${metodoEntrega === 'domicilio' ? 'border-current' : 'border-gray-200'}`}
                           style={metodoEntrega === 'domicilio' ? { borderColor: 'var(--color-acento)', backgroundColor: '#f0f7ff' } : {}}>
                      <input type="radio" value="domicilio" checked={metodoEntrega === 'domicilio'} onChange={() => setMetodoEntrega('domicilio')} className="mt-1" />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-gray-800"><MapPin size={16} /> Envío a domicilio</div>
                        <p className="text-xs font-bold mt-1" style={{ color: 'var(--color-acento)' }}>
                          {costoEnvio > 0 ? `+ ${formatPrecio(costoEnvio)}` : '¡ENVÍO GRATIS!'}
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {metodoEntrega === 'domicilio' && (
                  <div className="animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega *</label>
                    <input
                      ref={refs.direccion_entrega}
                      type="text"
                      value={direccionEntrega}
                      onChange={e => { setDireccionEntrega(e.target.value); limpiarError('direccion_entrega') }}
                      placeholder="Calle, número, barrio..."
                      className={`input-field ${errores.direccion_entrega ? 'border-red-400' : ''}`}
                    />
                    {errores.direccion_entrega && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errores.direccion_entrega}</p>}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas u observaciones</label>
                  <textarea
                    rows={2}
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Ej: Tocar timbre fuerte, dejar en portería..."
                    className="input-field resize-none"
                  />
                </div>
              </div>
            </div>

            {/* RESUMEN STICKY */}
            <div className="lg:relative">
              <div className="card p-5 lg:sticky lg:top-24 space-y-4 shadow-lg border-2 border-gray-100">
                <h2 className="font-bold text-gray-800 border-b pb-2">Resumen de compra</h2>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.idProductoLocal} className="flex justify-between text-sm">
                      <span className="text-gray-600"><span className="font-bold">{item.cantidad}x</span> {item.nombre}</span>
                      <span className="font-semibold">{formatPrecio(Number(item.precio) * Number(item.cantidad))}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatPrecio(subtotal)}</span>
                  </div>
                  {metodoEntrega === 'domicilio' && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Costo de envío</span>
                      <span className={costoEnvio === 0 ? 'text-green-600 font-bold' : ''}>{costoEnvio === 0 ? 'GRATIS' : formatPrecio(costoEnvio)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-dashed">
                    <span>TOTAL</span>
                    <span>{formatPrecio(total)}</span>
                  </div>
                </div>

                <button type="submit" disabled={enviando} className="btn-primary w-full py-4 text-base font-bold uppercase tracking-wider">
                  {enviando ? 'Procesando...' : 'Confirmar mi pedido'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* BOTÓN VOLVER ARRIBA (Móvil) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-white shadow-2xl border border-gray-200 text-gray-600 animate-bounce transition-all active:scale-95"
          aria-label="Volver arriba"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  )
}