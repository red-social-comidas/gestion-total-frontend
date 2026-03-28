import axios from 'axios'

// ── Instancia pública (sin auth) ──────────────────────────────────────────
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Instancia privada (con JWT) ───────────────────────────────────────────
export const apiPrivada = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: agregar JWT en cada request privado
apiPrivada.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch (_) {}
  }
  return config
})

// Interceptor: si 401, limpiar sesión y redirigir al login
apiPrivada.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/dashboard/login'
    }
    return Promise.reject(err)
  }
)

export const SLUG = import.meta.env.VITE_TENANT_SLUG
