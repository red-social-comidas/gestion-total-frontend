import { useMemo } from 'react'
import { formatPrecio } from '../lib/format'

/**
 * Genera el link y mensaje de WhatsApp para el pedido confirmado.
 * Incluye código de barras + descripción de cada ítem para facilitar
 * el armado logístico.
 *
 * @param {Object} params
 * @param {Object} params.config         - config_visual del tenant (nombre_comercial, whatsapp_numero)
 * @param {Object} params.pedido         - { numero_pedido, total, metodo_entrega, cliente_*, items[] }
 * @param {string} params.nombreCliente
 * @param {string} params.celularCliente
 * @param {string} params.metodoEntrega  - 'retiro' | 'domicilio'
 * @param {string} params.direccionEntrega
 * @param {string} params.notasCliente
 * @param {number} params.costoEnvio
 * @param {number} params.totalPedido
 */
export const useWhatsApp = ({
  config,
  pedido,
  nombreCliente,
  celularCliente,
  metodoEntrega,
  direccionEntrega,
  notasCliente,
  costoEnvio = 0,
  totalPedido = 0,
}) => {
  const mensaje = useMemo(() => {
    if (!config || !pedido) return ''

    try {
      const nombreTienda = config.nombre_comercial || 'Tienda'
      const numPedido    = pedido.numero_pedido || pedido.numero || ''

      // Líneas de ítems con código de barras + descripción + subtotal
      const items = pedido.items || []
      const lineasProductos = items.length > 0
        ? items.map(item => {
            const nombre    = item.nombre_producto || item.nombre || '—'
            const codigo    = item.codigo_barras   || ''
            const cantidad  = item.cantidad        || 1
            const precio    = Number(item.precio_unitario || item.precio || 0)
            const subtotal  = precio * cantidad
            const lineaCod  = codigo ? ` [${codigo}]` : ''
            return `• ${cantidad}x ${nombre}${lineaCod} → ${formatPrecio(subtotal)}`
          }).join('\n')
        : '(sin ítems)'

      const entregaTexto = metodoEntrega === 'domicilio'
        ? `Envío a domicilio${direccionEntrega ? `: ${direccionEntrega}` : ''}`
        : 'Retiro en local'

      const costoEnvioLinea = costoEnvio > 0
        ? `\n💳 Costo envío: ${formatPrecio(costoEnvio)}`
        : ''

      const notasLinea = notasCliente
        ? `\n📝 Notas: ${notasCliente}`
        : ''

      const linkPedido = numPedido
        ? `\n🔗 Ver pedido: ${window.location.origin}/tienda/${import.meta.env.VITE_TENANT_SLUG}/confirmacion/${numPedido}`
        : ''

      return `Hola *${nombreTienda}* 👋, soy *${nombreCliente || 'Cliente'}*.
Quiero confirmar el siguiente pedido:

${lineasProductos}
${costoEnvioLinea}

💰 *TOTAL: ${formatPrecio(totalPedido)}*
📦 Entrega: ${entregaTexto}
📞 Celular: ${celularCliente || 'No especificado'}${notasLinea}
——————————————
*N° Pedido:* ${numPedido}${linkPedido}`.trim()

    } catch (err) {
      console.error('[useWhatsApp] Error generando mensaje:', err)
      return ''
    }
  }, [config, pedido, nombreCliente, celularCliente, metodoEntrega,
      direccionEntrega, notasCliente, costoEnvio, totalPedido])

  const linkWhatsApp = useMemo(() => {
    if (!config?.whatsapp_numero || !mensaje) return '#'
    const tel = config.whatsapp_numero.replace(/\D/g, '')
    return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
  }, [config, mensaje])

  return { linkWhatsApp, mensaje }
}
