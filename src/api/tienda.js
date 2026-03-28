import { api, SLUG } from './axios'

// ── Info de la tienda (nombre, config_visual, horarios) ───────────────────
export const getInfoTienda = (slug = SLUG) =>
  api.get(`/tienda/${slug}/info`).then(r => r.data)

// ── Categorías ────────────────────────────────────────────────────────────
export const getCategorias = (slug = SLUG) =>
  api.get(`/tienda/${slug}/categorias`).then(r => r.data)

// ── Catálogo paginado con filtros ─────────────────────────────────────────
export const getProductos = (slug = SLUG, params = {}) =>
  api.get(`/tienda/${slug}/productos`, { params }).then(r => r.data)

// ── Detalle de un producto ────────────────────────────────────────────────
export const getProducto = (slug = SLUG, idLocal) =>
  api.get(`/tienda/${slug}/productos/${idLocal}`).then(r => r.data)

// ── Crear pedido desde el portal ──────────────────────────────────────────
export const crearPedido = (slug = SLUG, data) =>
  api.post(`/tienda/${slug}/pedidos`, data).then(r => r.data)

// ── Consultar estado de un pedido por número GTW-XXXXX ────────────────────
export const getPedidoPorNumero = (slug = SLUG, numeroPedido) =>
  api.get(`/tienda/${slug}/pedidos/${numeroPedido}`).then(r => r.data)
