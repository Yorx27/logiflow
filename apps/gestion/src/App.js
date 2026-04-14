import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { SolicitudesPage } from './pages/SolicitudesPage';
import { EntregasPage } from './pages/EntregasPage';
import { ConductoresPage } from './pages/ConductoresPage';
import { VehiculosPage } from './pages/VehiculosPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { FacturacionPage } from './pages/FacturacionPage';
import { ReportesPage } from './pages/ReportesPage';
import { ConfigPage } from './pages/ConfigPage';
import { NotificacionesPage } from './pages/NotificacionesPage';
import { AppConductorPage } from './pages/AppConductorPage';
import { InventarioPage } from './pages/InventarioPage';
import { ToastContainer } from './components/ui/ToastContainer';
function RequireAuth({ children }) {
    const { user } = useAuthStore();
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(RequireAuth, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "solicitudes", element: _jsx(SolicitudesPage, {}) }), _jsx(Route, { path: "entregas", element: _jsx(EntregasPage, {}) }), _jsx(Route, { path: "inventario", element: _jsx(InventarioPage, {}) }), _jsx(Route, { path: "conductores", element: _jsx(ConductoresPage, {}) }), _jsx(Route, { path: "vehiculos", element: _jsx(VehiculosPage, {}) }), _jsx(Route, { path: "calendario", element: _jsx(CalendarioPage, {}) }), _jsx(Route, { path: "facturacion", element: _jsx(FacturacionPage, {}) }), _jsx(Route, { path: "reportes", element: _jsx(ReportesPage, {}) }), _jsx(Route, { path: "app-conductor", element: _jsx(AppConductorPage, {}) }), _jsx(Route, { path: "notificaciones", element: _jsx(NotificacionesPage, {}) }), _jsx(Route, { path: "config", element: _jsx(ConfigPage, {}) })] })] }), _jsx(ToastContainer, {})] }));
}
