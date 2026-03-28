// ── Formateador de moneda ARS sin decimales ───────────────────────────────
const fmtARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatPrecio = (n) => fmtARS.format(Number(n) || 0)

// ── Fecha legible ──────────────────────────────────────────────────────────
export const formatFecha = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// ── Fecha solo día/mes ─────────────────────────────────────────────────────
export const formatFechaCorta = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit',
  }).format(new Date(iso))
}

// ── Antigüedad en texto legible ────────────────────────────────────────────
export const formatAntiguedad = (iso) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `hace ${days}d`
  if (hours > 0) return `hace ${hours}h`
  if (mins > 0)  return `hace ${mins}min`
  return 'ahora'
}

// ── Verifica si la tienda está abierta según horario config_visual ─────────
export const calcularEstadoTienda = (configVisual) => {
  if (!configVisual) return null
  const { horario_apertura, horario_cierre } = configVisual
  if (!horario_apertura || !horario_cierre) return null

  const ahora  = new Date()
  const [ha, ma] = horario_apertura.split(':').map(Number)
  const [hc, mc] = horario_cierre.split(':').map(Number)
  const minAhora  = ahora.getHours() * 60 + ahora.getMinutes()
  const minAbre   = ha * 60 + ma
  const minCierra = hc * 60 + mc

  return minAhora >= minAbre && minAhora < minCierra
}
