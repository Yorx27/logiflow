import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useConductorStore } from './stores/conductorStore';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { InicioPage } from './pages/InicioPage';
import { MisEntregasPage } from './pages/MisEntregasPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { HistorialPage } from './pages/HistorialPage';
import { NotificacionesPage } from './pages/NotificacionesPage';
import { PerfilPage } from './pages/PerfilPage';
import { ToastContainer } from './components/ToastContainer';
function RequireAuth({ children }) {
    const { conductor } = useConductorStore();
    if (!conductor)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsxs(_Fragment, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(RequireAuth, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/inicio", replace: true }) }), _jsx(Route, { path: "inicio", element: _jsx(InicioPage, {}) }), _jsx(Route, { path: "entregas", element: _jsx(MisEntregasPage, {}) }), _jsx(Route, { path: "checklist/:entregaId", element: _jsx(ChecklistPage, {}) }), _jsx(Route, { path: "historial", element: _jsx(HistorialPage, {}) }), _jsx(Route, { path: "notificaciones", element: _jsx(NotificacionesPage, {}) }), _jsx(Route, { path: "perfil", element: _jsx(PerfilPage, {}) })] })] }), _jsx(ToastContainer, {})] }));
}
