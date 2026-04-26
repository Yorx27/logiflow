import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { SolicitudesPage } from './pages/SolicitudesPage'
import { EntregasPage } from './pages/EntregasPage'
import { ConductoresPage } from './pages/ConductoresPage'
import { VehiculosPage } from './pages/VehiculosPage'
import { CalendarioPage } from './pages/CalendarioPage'
import { FacturacionPage } from './pages/FacturacionPage'
import { ReportesPage } from './pages/ReportesPage'
import { ConfigPage } from './pages/ConfigPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { AppConductorPage } from './pages/AppConductorPage'
import { InventarioPage } from './pages/InventarioPage'
import { GastosPage } from './pages/GastosPage'
import { ToastContainer } from './components/ui/ToastContainer'
import { MaintenancePage } from './pages/MaintenancePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  if (import.meta.env.VITE_MAINTENANCE_MODE === 'true') {
    return <MaintenancePage />
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="solicitudes" element={<SolicitudesPage />} />
          <Route path="entregas" element={<EntregasPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="conductores" element={<ConductoresPage />} />
          <Route path="vehiculos" element={<VehiculosPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="facturacion" element={<FacturacionPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="app-conductor" element={<AppConductorPage />} />
          <Route path="notificaciones" element={<NotificacionesPage />} />
          <Route path="gastos" element={<GastosPage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
      </Routes>
      <ToastContainer />
    </>
  )
}
