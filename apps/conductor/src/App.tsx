import { Routes, Route, Navigate } from 'react-router-dom'
import { useConductorStore } from './stores/conductorStore'
import { LoginPage } from './pages/LoginPage'
import { Layout } from './components/Layout'
import { InicioPage } from './pages/InicioPage'
import { MisEntregasPage } from './pages/MisEntregasPage'
import { ChecklistPage } from './pages/ChecklistPage'
import { HistorialPage } from './pages/HistorialPage'
import { NotificacionesPage } from './pages/NotificacionesPage'
import { PerfilPage } from './pages/PerfilPage'
import { GastosPage } from './pages/GastosPage'
import { ToastContainer } from './components/ToastContainer'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { MaintenancePage } from './pages/MaintenancePage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { conductor } = useConductorStore()
  if (!conductor) return <Navigate to="/login" replace />
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
          element={<RequireAuth><Layout /></RequireAuth>}
        >
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<InicioPage />} />
          <Route path="entregas" element={<MisEntregasPage />} />
          <Route path="checklist/:entregaId" element={<ChecklistPage />} />
          <Route path="historial" element={<HistorialPage />} />
          <Route path="notificaciones" element={<NotificacionesPage />} />
          <Route path="gastos" element={<GastosPage />} />
          <Route path="perfil" element={<PerfilPage />} />
        </Route>
      </Routes>
      <ToastContainer />
      <PwaUpdatePrompt />
    </>
  )
}
