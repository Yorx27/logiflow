import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useConductorStore } from '../stores/conductorStore'
import type { Notificacion } from '@logiflow/types'

const NAV = [
  { to: '/inicio', icon: '🏠', label: 'Inicio' },
  { to: '/entregas', icon: '🚚', label: 'Entregas' },
  { to: '/gastos', icon: '💸', label: 'Gastos' },
  { to: '/historial', icon: '📋', label: 'Historial' },
  { to: '/notificaciones', icon: '🔔', label: 'Alertas' },
  { to: '/perfil', icon: '👤', label: 'Perfil' },
]

export function Layout() {
  const { conductor } = useConductorStore()
  const location = useLocation()
  const isChecklist = location.pathname.startsWith('/checklist')

  const { data: notifs = [] } = useQuery<Notificacion[]>({
    queryKey: ['notif-conductor', conductor?.id],
    queryFn: async () => { const r = await api.get(`/notificaciones?conductorId=${conductor!.id}`); return r.data.data },
    enabled: !!conductor,
    refetchInterval: 30_000,
  })
  const unread = notifs.filter((n) => !n.leida).length

  return (
    <div className="flex flex-col min-h-screen bg-carbon-900">
      {!isChecklist && (
        <header className="bg-carbon-800/80 backdrop-blur-sm border-b border-carbon-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center font-display font-black text-carbon-900 text-sm">L</div>
            <span className="font-display font-bold text-white">LogiFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm">
              {conductor?.nombre.charAt(0)}
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {!isChecklist && (
        <nav className="fixed bottom-0 left-0 right-0 bg-carbon-800 border-t border-carbon-700 bottom-nav z-20">
          <div className="flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors relative
                   ${isActive ? 'text-amber-400' : 'text-carbon-500'}`
                }
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.to === '/notificaciones' && unread > 0 && (
                  <span className="absolute top-2 right-1/4 w-4 h-4 bg-amber-500 text-carbon-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
