import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ClipboardList, LogOut, Menu, X, Plus, BarChart2, Store, Settings } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard/pedidos',       icon: LayoutDashboard, label: 'Kanban'         },
  { to: '/dashboard/pedido-manual', icon: Plus,            label: 'Nuevo pedido'   },
  { to: '/dashboard/productos',     icon: Package,         label: 'Productos'      },
  { to: '/dashboard/reportes',      icon: BarChart2,       label: 'Reportes'       },
  { to: '/dashboard/configuracion', icon: Settings,        label: 'Configuración'  },
]

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const slug = import.meta.env.VITE_TENANT_SLUG

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900
                         flex flex-col transition-transform duration-300
                         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                 style={{ backgroundColor: 'var(--color-acento)' }}>
              <Store size={16} />
            </div>
            <span className="text-white font-bold text-sm">Dashboard</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                     className={({ isActive }) =>
                       `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`
                     }
                     style={({ isActive }) => isActive ? { backgroundColor: 'var(--color-acento)' } : {}}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 space-y-2">
          <button onClick={() => navigate(`/tienda/${slug}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                             text-gray-400 hover:text-white hover:bg-gray-800 transition-all w-full">
            <Store size={17} /> Ver tienda
          </button>
          <div className="px-3 py-1">
            <p className="text-xs text-gray-500 truncate">{usuario?.email || usuario?.nombre}</p>
          </div>
          <button onClick={logout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                             text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all w-full">
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden h-14 bg-white border-b border-gray-200
                        flex items-center px-4 gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-800 text-sm">Dashboard</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
