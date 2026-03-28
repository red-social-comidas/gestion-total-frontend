import { useParams, useLocation, Link } from 'react-router-dom'
import { CheckCircle, MessageCircle, Home, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useInfoTienda } from '../../hooks/useTienda'
import { useWhatsApp } from '../../hooks/useWhatsApp'
import { formatPrecio, formatFecha } from '../../lib/format'
import toast from 'react-hot-toast'

export default function ConfirmacionPage() {
  const { slug, numeroPedido } = useParams()
  const location = useLocation()
  const { data: infoTienda } = useInfoTienda(slug)
  const [mostrarMensaje, setMostrarMensaje] = useState(false)

  // Datos pasados por navegación desde CheckoutPage
  const state       = location.state || {}
  const form        = state.formData || {}
  const pedido      = state.pedido   || { numero_pedido: numeroPedido, items: state.itemsPedido || [] }
  const costoEnvio  = state.costoEnvio  || 0
  const totalPedido = state.totalPedido || 0
  const itemsPedido = state.itemsPedido || pedido.items || []

  const { linkWhatsApp, mensaje } = useWhatsApp({
    config:           infoTienda,
    pedido:           { ...pedido, items: itemsPedido },
    nombreCliente:    form.cliente_nombre,
    celularCliente:   form.cliente_celular,
    metodoEntrega:    form.metodo_entrega || pedido.metodo_entrega,
    direccionEntrega: form.direccion_entrega,
    notasCliente:     form.notas,
    costoEnvio,
    totalPedido,
  })

  const copiarMensaje = () => {
    if (!mensaje) return
    navigator.clipboard.writeText(mensaje)
      .then(() => toast.success('¡Mensaje copiado al portapapeles!'))
      .catch(() => toast.error('No se pudo copiar'))
  }

  const config  = infoTienda?.config_visual || {}
  const nombre  = infoTienda?.nombre_comercial || 'el negocio'

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50
                    flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-4 animate-fade-in">

        {/* Card principal — éxito */}
        <div className="card p-7 text-center space-y-4">
          {/* Ícono de éxito */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                          justify-center mx-auto">
            <CheckCircle size={36} className="text-green-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">¡Pedido recibido!</h1>
            <p className="text-gray-500 text-sm mt-1">
              Tu número de pedido es
            </p>
            <p className="text-3xl font-black mt-1"
               style={{ color: 'var(--color-acento)' }}>
              {numeroPedido}
            </p>
          </div>

          {/* Resumen rápido */}
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
            {form.cliente_nombre && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cliente</span>
                <span className="font-medium text-gray-800">{form.cliente_nombre}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Entrega</span>
              <span className="font-medium text-gray-800">
                {(form.metodo_entrega || pedido.metodo_entrega) === 'domicilio'
                  ? `🚚 Domicilio${form.direccion_entrega ? ` — ${form.direccion_entrega}` : ''}`
                  : '🏪 Retiro en local'}
              </span>
            </div>
            {totalPedido > 0 && (
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">{formatPrecio(totalPedido)}</span>
              </div>
            )}
          </div>

          {/* Mensaje de pago */}
          <p className="text-sm text-gray-500">
            El pago se coordina directamente con <strong>{nombre}</strong>.
            En breve te contactarán para confirmar.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 gap-3">
          {/* WhatsApp */}
          {linkWhatsApp && linkWhatsApp !== '#' ? (
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp justify-center text-base py-3.5"
            >
              <MessageCircle size={20} />
              Confirmar por WhatsApp
            </a>
          ) : (
            <div className="text-xs text-gray-400 text-center py-2">
              Sin configuración de WhatsApp en el negocio.
            </div>
          )}

          {/* Volver al catálogo */}
          <Link
            to={`/tienda/${slug}`}
            className="btn-secondary flex items-center justify-center gap-2 py-3.5"
          >
            <Home size={18} />
            Volver a la tienda
          </Link>
        </div>

        {/* Preview del mensaje colapsable */}
        {mensaje && (
          <div className="card overflow-hidden">
            <button
              onClick={() => setMostrarMensaje(m => !m)}
              className="w-full flex items-center justify-between px-4 py-3
                         text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={15} />
                Ver mensaje que se enviará por WhatsApp
              </span>
              {mostrarMensaje ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {mostrarMensaje && (
              <div className="border-t border-gray-100 animate-fade-in">
                <pre className="text-xs text-gray-700 bg-gray-50 px-4 py-3
                                whitespace-pre-wrap font-sans leading-relaxed">
                  {mensaje}
                </pre>
                <div className="px-4 pb-3">
                  <button
                    onClick={copiarMensaje}
                    className="flex items-center gap-1.5 text-xs text-gray-500
                               hover:text-gray-700 transition-colors"
                  >
                    <Copy size={12} /> Copiar mensaje
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
