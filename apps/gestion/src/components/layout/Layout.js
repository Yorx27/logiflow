import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../stores/uiStore';
import { useSocketEvents } from '../../hooks/useSocketEvents';
export function Layout() {
    const { sidebarOpen } = useUIStore();
    useSocketEvents();
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-carbon-900", children: [_jsx(Sidebar, {}), _jsxs("div", { className: `flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-4 md:p-6", children: _jsx("div", { className: "max-w-[1100px] mx-auto", children: _jsx(Outlet, {}) }) })] })] }));
}
