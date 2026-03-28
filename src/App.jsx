import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import { DashboardLayout }  from './components/layout/DashboardLayout'
import CatalogoPage         from './pages/public/CatalogoPage'
import CheckoutPage         from './pages/public/CheckoutPage'
import ConfirmacionPage     from './pages/public/ConfirmacionPage'
import LoginPage            from './pages/dashboard/LoginPage'
import KanbanPage           from './pages/dashboard/KanbanPage'
import PedidoManualPage     from './pages/dashboard/PedidoManualPage'
import ProductosPage        from './pages/dashboard/ProductosPage'
import ReportesPage         from './pages/dashboard/ReportesPage'
import ConfiguracionPage    from './pages/dashboard/ConfiguracionPage'

const SLUG = import.meta.env.VITE_TENANT_SLUG

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/dashboard/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/tienda/${SLUG}`} replace />} />

        {/* Públicas */}
        <Route path="/tienda/:slug"                            element={<CatalogoPage />} />
        <Route path="/tienda/:slug/checkout"                   element={<CheckoutPage />} />
        <Route path="/tienda/:slug/confirmacion/:numeroPedido" element={<ConfirmacionPage />} />

        {/* Dashboard */}
        <Route path="/dashboard/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardLayout /></ProtectedRoute>
        }>
          <Route index                  element={<Navigate to="/dashboard/pedidos" replace />} />
          <Route path="pedidos"         element={<KanbanPage />} />
          <Route path="pedido-manual"   element={<PedidoManualPage />} />
          <Route path="productos"       element={<ProductosPage />} />
          <Route path="reportes"        element={<ReportesPage />} />
          <Route path="configuracion"   element={<ConfiguracionPage />} />
        </Route>

        <Route path="*" element={<Navigate to={`/tienda/${SLUG}`} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
