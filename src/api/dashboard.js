import { apiPrivada, SLUG } from './axios'

// ── Pedidos — Kanban ──────────────────────────────────────────────────────
export const getKanban = () =>
  apiPrivada.get('/dashboard/pedidos/kanban').then(r => r.data)

export const getPedidos = (estado) =>
  apiPrivada.get('/dashboard/pedidos', { params: estado ? { estado } : {} }).then(r => r.data)

export const getPedido = (id) =>
  apiPrivada.get(`/dashboard/pedidos/${id}`).then(r => r.data)

export const cambiarEstadoPedido = (id, nuevoEstado) =>
  apiPrivada.patch(`/dashboard/pedidos/${id}/estado`, { nuevo_estado: nuevoEstado }).then(r => r.data)

// ── Pedido manual (cargado por el operador) ───────────────────────────────
export const crearPedidoManual = (data) =>
  apiPrivada.post('/dashboard/pedidos', { ...data, origen: 'dashboard_manual' }).then(r => r.data)

export const editarPedido = (id, data) =>
  apiPrivada.patch(`/dashboard/pedidos/${id}/editar`, data).then(r => r.data)

// ── Productos — dashboard ─────────────────────────────────────────────────
export const getProductosDashboard = () =>
  apiPrivada.get('/dashboard/productos').then(r => r.data)

export const habilitarProductoWeb = (id, habilitado_web) =>
  apiPrivada.patch(`/dashboard/productos/${id}/habilitar`, { habilitado_web }).then(r => r.data)

export const actualizarDescripcionWeb = (id, descripcion_web) =>
  apiPrivada.patch(`/dashboard/productos/${id}/descripcion`, { descripcion_web }).then(r => r.data)

export const subirImagenProducto = (id, file) => {
  const form = new FormData()
  form.append('imagen', file)
  return apiPrivada.post(`/dashboard/productos/${id}/imagen`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

// ── Búsqueda de productos (para pedido manual — autocompletar) ────────────
export const buscarProductos = (q, pagina = 1) =>
  apiPrivada.get(`/tienda/${SLUG}/productos`, {
    params: { q, page: pagina, page_size: 10 }
  }).then(r => r.data)
