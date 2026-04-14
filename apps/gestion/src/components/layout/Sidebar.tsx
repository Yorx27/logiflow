import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import { useNotifBadge } from '../../hooks/useNotifBadge'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/solicitudes', icon: '📋', label: 'Solicitudes' },
  { to: '/entregas', icon: '🚚', label: 'Entregas' },
  { to: '/inventario', icon: '📦', label: 'Inventario' },
  { to: '/conductores', icon: '👤', label: 'Conductores' },
  { to: '/vehiculos', icon: '🚛', label: 'Vehículos' },
  { to: '/calendario', icon: '📅', label: 'Calendario' },
  { to: '/facturacion', icon: '💰', label: 'Facturación' },
  { to: '/reportes', icon: '📈', label: 'Reportes' },
  { to: '/app-conductor', icon: '📱', label: 'App Conductor' },
  { to: '/notificaciones', icon: '🔔', label: 'Notificaciones' },
  { to: '/config', icon: '⚙️', label: 'Configuración' },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const unread = useNotifBadge()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-carbon-800 border-r border-carbon-700
                    z-30 flex flex-col transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-carbon-700">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-display font-bold text-carbon-900 text-lg">
            L
          </div>
          <div>
            <p className="font-display font-bold text-white leading-none">LogiFlow</p>
            <p className="text-carbon-400 text-xs">Portal Gestión</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors
                 ${isActive
                   ? 'bg-amber-500/15 text-amber-400 font-semibold'
                   : 'text-carbon-300 hover:bg-carbon-700 hover:text-white'}`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/notificaciones' && unread > 0 && (
                <span className="ml-auto bg-amber-500 text-carbon-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-carbon-700 text-xs text-carbon-500">
          Powered by RAGA · CDMX
        </div>
      </aside>
    </>
  )
}
