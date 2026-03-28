import { useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Store, AlertCircle } from 'lucide-react'
import { useCarritoStore } from '../../store/carritoStore'
import { useInfoTienda } from '../../hooks/useTienda'
import { crearPedido } from '../../api/tienda'
import { formatPrecio } from '../../lib/format'
import { Header } from '../../components/layout/Header'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const items    = useCarritoStore(s => s.items)
  // FIX: llamar total() como función
  const subtotal = useCarritoStore(s => s.total())
  const vaciar   = useCarritoStore(s => s.vaciar)
  const { data: infoTienda } = useInfoTienda(slug)

  const config = infoTienda?.config_visual || {}

  // FIX BUG INPUTS: renombrar el setter para no colisionar con 'set' de zustand
  const [clienteNombre,    setClienteNombre]    = useState('')
  const [clienteCelular,   setClienteCelular]   = useState('')
  const [clienteEmail,     setClienteEmail]     = useState('')
  const [clienteDocumento, setClienteDocumento] = useState('')
  const [metodoEntrega,    setMetodoEntrega]    = useState('retiro')
  const [direccionEntrega, setDireccionEntrega] = useState('')
  const [notas,            setNotas]            = useState('')
  const [errores,          setErrores]          = useState({})
  const [enviando,         setEnviando]         = useState(false)

  // Calcular costo de envío
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

  const validar = () => {
    const e = {}
    if (!clienteNombre.trim())    e.cliente_nombre    = 'Nombre requerido'
    if (!clienteCelular.trim())   e.cliente_celular   = 'Celular requerido'
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
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    setEnviando(true)
    try {
      const pedido = await crearPedido(slug, {
        cliente_nombre:    clienteNombre,
        cliente_celular:   clienteCelular,
        cliente_email:     clienteEmail   || null,
        cliente_documento: clienteDocumento || null,
        metodo_entrega:    metodoEntrega,
        direccion_entrega: direccionEntrega || null,
        notas:             notas || null,
        items: items.map(i => ({
          id_producto_local: i.idProductoLocal,
          cantidad:          i.cantidad,
        })),
      })
      vaciar()
      navigate(`/tienda/${slug}/confirmacion/${pedido.numero_pedido}`, {
        state: {
          formData: {
            cliente_nombre:    clienteNombre,
            cliente_celular:   clienteCelular,
            metodo_entrega:    metodoEntrega,
            direccion_entrega: direccionEntrega,
            notas,
          },
          costoEnvio,
          totalPedido: total,
          itemsPedido: items,
          pedido,
        },
      })
    } catch (err) {
      const msg = err.response?.data?.detail
      toast.error(typeof msg === 'string' ? msg : 'Error al enviar el pedido. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header infoTienda={infoTienda} />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Carrito vacío</h2>
          <p className="text-gray-500 mb-6">Agregá productos antes de hacer el pedido.</p>
          <Link to={`/tienda/${slug}`} className="btn-primary">Ver catálogo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header infoTienda={infoTienda} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to={`/tienda/${slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500
                         hover:text-gray-700 mb-5 transition-colors">
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar pedido</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Columna formulario */}
            <div className="lg:col-span-2 space-y-5">

              {/* Datos personales */}
              <div className="card p-5 space-y-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold
                                   flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-acento)' }}>1</span>
                  Tus datos
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Nombre — campo individual, sin re-render de otros */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={e => { setClienteNombre(e.target.value); limpiarError('cliente_nombre') }}
                      placeholder="Ej: Juan Pérez"
                      autoComplete="name"
                      className={`input-field ${errores.cliente_nombre ? 'border-red-400' : ''}`}
                    />
                    {errores.cliente_nombre && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errores.cliente_nombre}
                      </p>
                    )}
                  </div>

                  {/* Celular */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular / WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={clienteCelular}
                      onChange={e => { setClienteCelular(e.target.value); limpiarError('cliente_celular') }}
                      placeholder="Ej: 3624123456"
                      autoComplete="tel"
                      className={`input-field ${errores.cliente_celular ? 'border-red-400' : ''}`}
                    />
                    {errores.cliente_celular && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errores.cliente_celular}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={e => setClienteEmail(e.target.value)}
                      placeholder="tucorreo@gmail.com"
                      autoComplete="email"
                      className="input-field"
                    />
                  </div>

                  {/* DNI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI / CUIT
                      <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={clienteDocumento}
                      onChange={e => { setClienteDocumento(e.target.value); limpiarError('cliente_documento') }}
                      placeholder="Ej: 28456789"
                      className={`input-field ${errores.cliente_documento ? 'border-red-400' : ''}`}
                    />
                    <p className="text-xs text-gray-400 mt-1">Para facturas y órdenes</p>
                    {errores.cliente_documento && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errores.cliente_documento}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Método de entrega */}
              <div className="card p-5 space-y-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold
                                   flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-acento)' }}>2</span>
                  Método de entrega
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {config.acepta_retiro !== false && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                                       transition-all ${metodoEntrega === 'retiro'
                                         ? 'border-current' : 'border-gray-200 hover:border-gray-300'}`}
                           style={metodoEntrega === 'retiro' ? { borderColor: 'var(--color-acento)', backgroundColor: '#f0f7ff' } : {}}>
                      <input type="radio" value="retiro"
                             checked={metodoEntrega === 'retiro'}
                             onChange={() => setMetodoEntrega('retiro')}
                             className="mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-sm text-gray-800">
                          <Store size={15} /> Retiro en local
                        </div>
                        {config.direccion_local && (
                          <p className="text-xs text-gray-500 mt-0.5">{config.direccion_local}</p>
                        )}
                        <p className="text-xs text-green-600 font-medium mt-0.5">Sin costo extra</p>
                      </div>
                    </label>
                  )}

                  {config.acepta_domicilio !== false && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                                       transition-all ${metodoEntrega === 'domicilio'
                                         ? 'border-current' : 'border-gray-200 hover:border-gray-300'}`}
                           style={metodoEntrega === 'domicilio' ? { borderColor: 'var(--color-acento)', backgroundColor: '#f0f7ff' } : {}}>
                      <input type="radio" value="domicilio"
                             checked={metodoEntrega === 'domicilio'}
                             onChange={() => setMetodoEntrega('domicilio')}
                             className="mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-sm text-gray-800">
                          <MapPin size={15} /> Envío a domicilio
                        </div>
                        {costoEnvio > 0 ? (
                          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-acento)' }}>
                            + {formatPrecio(costoEnvio)}
                          </p>
                        ) : (
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            {Number(config.envio_gratis_desde) > 0
                              ? `¡Gratis superando ${formatPrecio(config.envio_gratis_desde)}!`
                              : 'Envío gratuito'}
                          </p>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                {metodoEntrega === 'domicilio' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección de entrega <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={direccionEntrega}
                      onChange={e => { setDireccionEntrega(e.target.value); limpiarError('direccion_entrega') }}
                      placeholder="Calle, número, piso, depto, ciudad..."
                      className={`input-field ${errores.direccion_entrega ? 'border-red-400' : ''}`}
                    />
                    {errores.direccion_entrega && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errores.direccion_entrega}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Ej: Sin picante, llamar antes de entregar..."
                    className="input-field resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Resumen sticky */}
            <div>
              <div className="card p-5 sticky top-20 space-y-4">
                <h2 className="font-semibold text-gray-800">Resumen del pedido</h2>

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.idProductoLocal}
                         className="flex justify-between items-start text-sm gap-2">
                      <span className="text-gray-700 flex-1 leading-tight">
                        <span className="font-medium">{item.cantidad}×</span> {item.nombre}
                      </span>
                      <span className="text-gray-900 font-medium flex-shrink-0">
                        {formatPrecio(Number(item.precio) * Number(item.cantidad))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrecio(subtotal)}</span>
                  </div>
                  {metodoEntrega === 'domicilio' && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Envío</span>
                      <span className={costoEnvio === 0 ? 'text-green-600 font-medium' : ''}>
                        {costoEnvio === 0 ? 'GRATIS' : formatPrecio(costoEnvio)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900
                                  border-t border-gray-100 pt-2">
                    <span>TOTAL</span>
                    <span>{formatPrecio(total)}</span>
                  </div>
                </div>

                <button type="submit" disabled={enviando} className="btn-primary w-full py-3 text-sm">
                  {enviando ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent
                                       rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    `Confirmar pedido — ${formatPrecio(total)}`
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  El pago se coordina con el negocio al confirmar.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
