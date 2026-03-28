import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Eye, EyeOff } from 'lucide-react'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Completá todos los campos'); return }
    setLoading(true)
    try {
      const data = await login(email.trim(), password)
      // Decodificar payload del JWT para obtener usuario
      const [, payload] = data.access_token.split('.')
      const decoded = JSON.parse(atob(payload + '=='.slice(0, (4 - payload.length % 4) % 4)))
      setAuth(data.access_token, { email: decoded.sub, nombre: decoded.nombre, rol: decoded.rol })
      navigate('/dashboard/pedidos', { replace: true })
    } catch (err) {
      toast.error('Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ backgroundColor: 'var(--color-acento)' }}>
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Gestion Total Web</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-2xl p-7 shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@minegocio.com"
                autoComplete="email"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl
                           px-4 py-2.5 text-sm placeholder-gray-500
                           focus:outline-none focus:border-acento focus:ring-1 transition-all"
                style={{ '--tw-ring-color': 'var(--color-acento)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl
                             px-4 py-2.5 pr-10 text-sm placeholder-gray-500
                             focus:outline-none focus:border-acento focus:ring-1 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-200 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm
                         transition-all active:scale-95 disabled:opacity-60 mt-2"
              style={{ backgroundColor: 'var(--color-acento)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
